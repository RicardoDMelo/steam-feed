# steam-feed

Duas lambdas AWS que juntas mantêm um feed diário de jogos da Steam, usando o [SteamSpy](https://steamspy.com/api.php) como fonte de dados e uma tabela DynamoDB `games` como armazenamento compartilhado.

## Estrutura do repositório

Dois pacotes npm **independentes** (não é um monorepo/workspace — cada um tem seu próprio `package.json`, `package-lock.json`, `tsconfig.json` e `node_modules`):

- **[`game-query/`](game-query/CLAUDE.md)** — somente leitura. Lista jogos do dia, busca por id. Nunca chama o SteamSpy nem escreve na tabela.
- **[`steam-fetch/`](steam-fetch/CLAUDE.md)** — ingestão e escrita. `POST /steam-fetch` busca a próxima página do SteamSpy e grava os jogos + cursor de paginação no DynamoDB; `DELETE /steam-fetch` limpa a tabela.

Código (tipos de domínio, helper de data) é intencionalmente duplicado entre os dois pacotes em vez de compartilhado, já que não há workspace/monorepo tooling configurado.

## Modelo de dados compartilhado

Tabela DynamoDB `games`, chave primária composta `appId` (partition) + `dateAdded` (sort, formato `YYYY-MM-DD`), com um GSI `dateAddedKey` (partition `dateAdded`) usado por `game-query` para listar jogos do dia ordenados por `owners` (mais possuído primeiro).

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
3. Clientes consultam `game-query` (`GET /game-query`, `GET /game-query/:id`) para ler os jogos já ingeridos no dia.

## Deploy

Via GitHub Actions (`.github/workflows/main.yml`, na raiz), usando OIDC para assumir uma role AWS e `aws-actions/aws-lambda-deploy` para publicar 3 lambdas Node 24:

- `game-query` — `game-query/dist`, handler `query.handler`
- `game-get` — `game-query/dist`, handler `get.handler`
- `steam-fetch` — `steam-fetch/dist`, handler `fetch.handler`

Cada pacote builda seu próprio bundle via `npm run build` (esbuild) antes do deploy.

## Desenvolvimento local

Cada pacote sobe seu próprio servidor Express (`npm run dev`, com `tsx watch`) na porta definida por `PORT` (default `3000`) — rode os dois em portas diferentes para testar o fluxo completo (`steam-fetch` ingerindo, `game-query` consultando o resultado).
