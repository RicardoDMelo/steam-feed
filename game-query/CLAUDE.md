# game-query

O **router** do supergraph GraphQL (Apollo Federation) — não tem lógica de domínio própria. É o único ponto de entrada GraphQL para clientes: recebe uma query, consulta o SDL do supergraph composto e roteia cada campo para o subgraph que o possui ([`game-summary`](../game-summary/CLAUDE.md), [`game-news`](../game-news/CLAUDE.md), [`game-review`](../game-review/CLAUDE.md)).

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`, `@as-integrations/aws-lambda`)
- GraphQL: Apollo Server + `@apollo/gateway` (federation runtime)
- Composição de schema: [Rover](https://www.apollographql.com/docs/rover/) (`@apollo/rover`)
- Servidor local de desenvolvimento com Apollo standalone (`src/local-server.ts`)

## Scripts

- `npm run build` — gera o bundle do handler (`src/index.ts`) e copia `src/schema.graphql` para `dist/`
- `npm run dev` — sobe o servidor Apollo standalone local com `tsx watch` (hot reload)
- `npm run supergraph` — `rover supergraph compose --config ./supergraph.yaml --output src/schema.graphql`; recompõe o SDL do supergraph a partir dos schemas dos 3 subgraphs. Rodar sempre que um subgraph mudar seu `schema.graphql`.

## Estrutura

- `supergraph.yaml` — declara os subgraphs (`summary`, `news`, `review`), cada um com sua `routing_url` (API Gateway) e o caminho do respectivo `schema.graphql` local, usado só para composição
- `src/schema.graphql` — SDL do supergraph **gerado** pelo Rover (não editar à mão; rodar `npm run supergraph`). Carregado em runtime pelo `ApolloGateway`
- `src/graph.ts` — instancia `ApolloGateway` a partir do `schema.graphql` e o `ApolloServer` (sem resolvers próprios)
- `src/index.ts` — handler Lambda (wrap do Apollo Server via `@as-integrations/aws-lambda`)
- `src/local-server.ts` — wrapper Apollo standalone para dev local

## Federation

`game-query` não define nenhum tipo ou resolver — todo o schema exposto vem da composição dos subgraphs. A entidade `GameSummary` (chave `appId`) é resolvida combinando:
- `game-summary` (dono): `name`, `developer`, `publisher`, `positive`, `negative`, `owners`, `dateAdded`
- `game-news` (extensão): `news`
- `game-review` (extensão): `reviews`

Query raiz exposta: `gameSummaries(cursor: String)`, `gameSummary(appId: Int!)`, `gameNews(appId: Int!)`, `gameReviews(appId: Int!, language: String)`.

Para atualizar o supergraph depois de mudar um subgraph: editar o `schema.graphql` do subgraph correspondente, rodar `npm run supergraph` aqui, e commitar o novo `src/schema.graphql`.

## Variáveis de ambiente

- `PORT` — porta do servidor local (default: `3000`)
