# game-news

Subgraph GraphQL (Apollo Federation) que **consulta notícias** de jogos direto da Steam Web API (`GET /ISteamNews/GetNewsForApp/v0002`). Não usa banco de dados nem SNS — sempre busca as notícias mais recentes da API da Steam em tempo real, sem persistir nada.

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`, `@as-integrations/aws-lambda`)
- GraphQL: Apollo Server + Apollo Federation (`@apollo/server`, `@apollo/subgraph`)
- Servidor local de desenvolvimento com Apollo standalone (`src/local-server.ts`)

## Scripts

- `npm run build` — gera o bundle do handler (`src/index.ts`) em `dist/`
- `npm run dev` — sobe o servidor Apollo standalone local com `tsx watch` (hot reload)

## Estrutura

- `src/graph.ts` — schema GraphQL federado e resolvers
- `src/index.ts` — handler Lambda (wrap do Apollo Server via `@as-integrations/aws-lambda`)
- `src/local-server.ts` — wrapper Apollo standalone para dev local
- `src/handlers/query.ts` — busca as notícias de um jogo (`queryGameNews`)
- `src/domain/news.ts` — tipo `GameNews` (modelo de notícia)
- `src/domain/summary.ts` — stub do tipo `GameSummary` (entidade estendida via federation, dono é `game-query`/`game-summary`)
- `src/infra/steam.repository.ts` — acesso de leitura à Steam Web API (`api.steampowered.com/ISteamNews/GetNewsForApp`), mapeia a resposta para `GameNews`

## Modelo de dados

`GameNews`:
```ts
{
  newsId: string;
  appId: number;
  title: string;
  url: string;
}
```

Sem paginação: sempre são retornadas as 5 notícias mais recentes (`count=5`, `maxlength=300`) direto da Steam.

## Federation

- `Query.gameNews(appId: Int!): [GameNews!]!` — lista as notícias de um jogo.
- `GameSummary` (tipo estendido, chave `appId`) — ganha o campo `news: [GameNews]`, resolvido via `__resolveReference` chamando a mesma busca na Steam.

## Variáveis de ambiente

- `PORT` — porta do servidor local (default: `3000`)
