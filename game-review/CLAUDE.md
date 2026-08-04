# game-review

Subgraph GraphQL (Apollo Federation) que **consulta análises (reviews)** de jogos direto da Steam Store API (`GET /appreviews/{appid}`). Não usa banco de dados nem SNS — sempre busca a primeira página de reviews da API da Steam em tempo real, sem persistir nada.

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`, `@as-integrations/aws-lambda`)
- GraphQL: Apollo Server + Apollo Federation (`@apollo/server`, `@apollo/subgraph`)
- Servidor local de desenvolvimento com Apollo standalone (`src/local-server.ts`)

## Scripts

- `npm run build` — gera o bundle do handler (`src/index.ts`) em `dist/`
- `npm run dev` — sobe o servidor Apollo standalone local com `tsx watch` (hot reload)
- `npm run start` — roda `dist/index.js` (produção)

## Estrutura

- `src/graph.ts` — schema GraphQL federado e resolvers
- `src/index.ts` — handler Lambda (wrap do Apollo Server via `@as-integrations/aws-lambda`)
- `src/local-server.ts` — wrapper Apollo standalone para dev local
- `src/handlers/query.ts` — busca as reviews de um jogo (`queryGameReviews`)
- `src/domain/review.ts` — tipo `GameReview` (modelo de review)
- `src/domain/summary.ts` — stub do tipo `GameSummary` (entidade estendida via federation, dono é `game-query`/`game-summary`)
- `src/infra/steam.repository.ts` — acesso de leitura à Steam Store API (`store.steampowered.com/appreviews/{appid}`), mapeia a resposta para `GameReview`

## Modelo de dados

`GameReview`:
```ts
{
  recommendationId: number;
  appId: number;
  review: string;
  language: string;
  votesUp: number;
}
```

Não há paginação: sempre é retornada a primeira página de reviews da Steam (idioma `english`).

## Federation

- `Query.gameReviews(appId: Int!, language: String): [GameReview!]!` — lista as reviews de um jogo. `language` é opcional (default `english`).
- `GameSummary` (tipo estendido, chave `appId`) — ganha o campo `reviews: [GameReview]`, resolvido via `__resolveReference` chamando a mesma busca na Steam (sempre em `english`, já que o resolver não recebe o argumento `language`).

## Variáveis de ambiente

- `PORT` — porta do servidor local (default: `3000`)
