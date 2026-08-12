# game-summary

Subgraph GraphQL (Apollo Federation) dono da entidade `GameSummary` — os dados core de um jogo. Lê dados persistidos na tabela DynamoDB `games`. Não escreve na tabela — ingestão e limpeza são responsabilidade do serviço irmão [`steam-fetch`](../steam-fetch/CLAUDE.md). A listagem (`gameSummaries`) faz uma exceção de leitura ao SteamSpy: se a tabela não tiver jogos para o dia, busca uma página diretamente do SteamSpy como fallback (sem persistir o resultado).

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`, `@as-integrations/aws-lambda`)
- GraphQL: Apollo Server + Apollo Federation (`@apollo/server`, `@apollo/subgraph`)
- Banco: DynamoDB (`@aws-sdk/lib-dynamodb`)
- Notificações: SNS (`@aws-sdk/client-sns`)
- Servidor local de desenvolvimento com Apollo standalone (`src/local-server.ts`)

## Scripts

- `npm run build` — gera o bundle do handler (`src/index.ts`) e copia `src/schema.graphql` para `dist/`
- `npm run dev` — sobe o servidor Apollo standalone local com `tsx watch` (hot reload)
- `npm run start` — roda `dist/index.js` (produção)

## Estrutura

- `src/graph.ts` — schema GraphQL federado (`buildSubgraphSchema`) e resolvers (`Query.gameSummaries`, `Query.gameSummary`, `GameSummary.__resolveReference`)
- `src/index.ts` — handler Lambda (wrap do Apollo Server via `@as-integrations/aws-lambda`)
- `src/local-server.ts` — wrapper Apollo standalone para dev local
- `src/handlers/query.ts` — `queryGameSummaries`: paginação sobre o DynamoDB, com fallback ao SteamSpy
- `src/handlers/get.ts` — `fetchGameSummary`: busca um jogo por `appId`
- `src/domain/summary.ts` — tipo `GameSummary` e `orderGameSummary` (normaliza a ordem/forma dos campos antes de retornar)
- `src/infra/game.repository.ts` — acesso de leitura ao DynamoDB (tabela `games`): `getGames` (query paginada pelo GSI `dateAddedKey`), `getGameByAppId`
- `src/infra/spy.repository.ts` — fallback de leitura direto no SteamSpy (`request=all`), usado por `queryGameSummaries` quando a tabela não tem jogos para o dia; não persiste nada
- `src/infra/failed-query.topic.ts` — publica no tópico SNS `FAILED_QUERY_TOPIC_ARN` quando uma query não retorna mais páginas (fim dos dados do dia) ou cai no fallback do SteamSpy — sinal de que a ingestão (`steam-fetch`) provavelmente precisa rodar mais
- `src/helpers/cursor.ts` — encode/decode do cursor de paginação (base64 da `LastEvaluatedKey` do DynamoDB)
- `src/helpers/date.ts` — data atual no formato `YYYY-MM-DD`, usada como chave de partição

## Modelo de dados

Tabela DynamoDB `games` (compartilhada com `steam-fetch`), chave primária composta `appId` (partition) + `dateAdded` (sort), com um GSI `dateAddedKey` (partition `dateAdded`) usado para listar jogos por dia de ingestão, ordenado por `owners` (mais possuído primeiro).

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

Existe um item sentinela reservado (`appId = -1`) na mesma tabela, usado por `steam-fetch` para guardar o cursor de paginação da ingestão do SteamSpy (`lastPage`). `game-summary` não lê nem escreve esse item diretamente.

## Federation

- `Query.gameSummaries(cursor: String): GameSummaryConnection!` — lista jogos do dia atual (paginado, 10 por página). Se a tabela não retornar nenhum jogo para o dia, busca a primeira página do SteamSpy como fallback.
- `Query.gameSummary(appId: Int!): GameSummary` — busca um jogo específico pelo `appId`, para a data atual.
- `GameSummary` (`@key(fields: "appId")`) — dono dos campos `name`, `developer`, `publisher`, `positive`, `negative`, `owners`, `dateAdded`; resolvido via `__resolveReference` quando outro subgraph ([`game-news`](../game-news/CLAUDE.md), [`game-review`](../game-review/CLAUDE.md)) referencia a entidade.

## Variáveis de ambiente

- `AWS_REGION` — região do DynamoDB (default: `sa-east-1`)
- `FAILED_QUERY_TOPIC_ARN` — ARN do tópico SNS notificado quando a query esgota a tabela do dia ou cai no fallback do SteamSpy
- `PORT` — porta do servidor local (default: `3000`)
