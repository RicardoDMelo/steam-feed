# steam-feed

Backend de um feed diário de jogos da Steam: uma lambda de ingestão (`steam-fetch`) alimenta o [SteamSpy](https://steamspy.com/api.php) numa tabela DynamoDB `games`, e um **supergraph GraphQL (Apollo Federation)** — composto por `game-query` (gateway) + `game-summary`/`game-news`/`game-review` (subgraphs) — expõe esses dados combinados com notícias e reviews consultadas ao vivo na Steam.

## Estrutura do repositório

Cinco pacotes npm **independentes** (não é um monorepo/workspace — cada um tem seu próprio `package.json`, `package-lock.json`, `tsconfig.json` e `node_modules`), publicados como 5 funções Lambda:

- **[`game-query/`](game-query/CLAUDE.md)** — o **router** do supergraph (`@apollo/gateway`). Não tem lógica de domínio própria; carrega o SDL composto (`schema.graphql`, gerado via Rover a partir de `supergraph.yaml`) e roteia cada campo de uma query para o subgraph dono daquele campo. Único ponto de entrada GraphQL para clientes.
- **[`game-summary/`](game-summary/CLAUDE.md)** — subgraph dono da entidade `GameSummary`. Lê a tabela `games` no DynamoDB; se não houver jogos para o dia, cai de volta para uma leitura direta ao SteamSpy (sem persistir).
- **[`game-news/`](game-news/CLAUDE.md)** — subgraph que estende `GameSummary` com o campo `news`, resolvido ao vivo na Steam Web API. Não usa banco de dados.
- **[`game-review/`](game-review/CLAUDE.md)** — subgraph que estende `GameSummary` com o campo `reviews`, resolvido ao vivo na Steam Store API. Não usa banco de dados.
- **[`steam-fetch/`](steam-fetch/CLAUDE.md)** — ingestão e escrita, fora do supergraph (REST simples). `POST /steam-fetch` busca a próxima página do SteamSpy e grava os jogos + cursor de paginação no DynamoDB; `DELETE /steam-fetch` limpa a tabela.

Código (tipos de domínio, helpers de data/cursor) é intencionalmente duplicado entre os pacotes em vez de compartilhado, já que não há workspace/monorepo tooling configurado.

## Apollo Federation

`game-query/supergraph.yaml` declara os 3 subgraphs GraphQL (`summary`, `news`, `review`) com suas `routing_url`. O Rover compõe isso num SDL de supergraph (`game-query/src/schema.graphql`, `npm run supergraph` dentro de `game-query`), que o `ApolloGateway` carrega em runtime.

A entidade compartilhada `GameSummary` é referenciada por `appId` (`@key(fields: "appId")`) nos três subgraphs: `game-summary` é o dono (campos `name`, `developer`, `publisher`, `positive`, `negative`, `owners`, `dateAdded`), enquanto `game-news` e `game-review` a estendem para agregar `news` e `reviews` via `__resolveReference`, sem duplicar os dados core.

## Modelo de dados compartilhado

Tabela DynamoDB `games`, chave primária composta `appId` (partition) + `dateAdded` (sort, formato `YYYY-MM-DD`), com um GSI `dateAddedKey` (partition `dateAdded`) usado por `game-summary` para listar jogos do dia ordenados por `owners` (mais possuído primeiro).

`GameSummary`:
```ts
{
  appId: number;
  name: string;
  developer: string;
  publisher: string;
  positive: number;
  negative: number;
  owners: number;
  dateAdded: string; // YYYY-MM-DD
}
```

Um item sentinela (`appId = -1`) guarda o cursor de paginação da ingestão do SteamSpy (`lastPage`); só `steam-fetch` lê/escreve nele.

## Fluxo

1. Algo (ex.: um agendamento externo, ou uma chamada manual) dispara `POST /steam-fetch`.
2. `steam-fetch` busca a próxima página do SteamSpy, grava os jogos na tabela `games` e avança o cursor `lastPage`.
3. Clientes consultam o supergraph via `game-query`, que roteia cada campo para `game-summary` (dados persistidos, com fallback ao SteamSpy) e para `game-news`/`game-review` (dados ao vivo da Steam), juntando tudo numa resposta só.

## Deploy

Via GitHub Actions (`.github/workflows/main.yml`, na raiz), usando OIDC para assumir uma role AWS e `aws-actions/aws-lambda-deploy` para publicar 5 lambdas Node 24:

- `game-summary` — `game-summary/dist`, handler `index.handler`
- `game-review` — `game-review/dist`, handler `index.handler`
- `game-news` — `game-news/dist`, handler `index.handler`
- `game-query` — `game-query/dist`, handler `index.handler`
- `steam-fetch` — `steam-fetch/dist`, handler `fetch.handler`

Cada pacote builda seu próprio bundle via `npm run build` (esbuild) antes do deploy. As lambdas GraphQL (`game-summary`, `game-news`, `game-review`) ficam por trás de um API Gateway em rotas `/subgraphs/*`, que são as `routing_url` referenciadas em `game-query/supergraph.yaml`.

## Desenvolvimento local

Cada pacote sobe seu próprio servidor local (`npm run dev`, com `tsx watch`) na porta definida por `PORT` (default `3000`, exceto `steam-fetch` que usa `3001`) — rode todos em portas diferentes para testar o fluxo completo (`steam-fetch` ingerindo, `game-summary`/`game-news`/`game-review` como subgraphs, `game-query` como gateway apontando para as `routing_url` deles).
