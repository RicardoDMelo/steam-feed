# game-query

Serviço serverless (AWS Lambda) que **consulta** dados de jogos da Steam persistidos em uma tabela DynamoDB chamada `games`. Não escreve na tabela — ingestão e limpeza são responsabilidade do serviço irmão [`steam-fetch`](../steam-fetch/CLAUDE.md). A listagem (`GET /game-query`) faz uma exceção de leitura ao SteamSpy: se a tabela não tiver jogos para o dia, busca uma página diretamente do SteamSpy como fallback (sem persistir o resultado).

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`)
- Banco: DynamoDB (`@aws-sdk/lib-dynamodb`)
- Servidor local de desenvolvimento com Express (`src/local-server.ts`)

## Scripts

- `npm run build` — gera os bundles dos 2 handlers (`query`, `get`) em `dist/`
- `npm run dev` — sobe o servidor Express local com `tsx watch` (hot reload)
- `npm run start` — roda `dist/index.js` (produção)

## Estrutura

- `src/query.ts`, `src/get.ts` — handlers Lambda (um arquivo por endpoint)
- `src/local-server.ts` — wrapper Express que expõe os handlers como rotas HTTP para dev local
- `src/domain/summary.ts` — tipo `GameSummary` (modelo principal de jogo)
- `src/infra/game.repository.ts` — acesso de leitura ao DynamoDB (tabela `games`): listar por dia, buscar por id
- `src/infra/spy.repository.ts` — fallback de leitura direto no SteamSpy (`request=all`), usado por `query.ts` quando a tabela não tem jogos para o dia; não persiste nada
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

Existe um item sentinela reservado (`appId = -1`) na mesma tabela, usado por `steam-fetch` para guardar o cursor de paginação da ingestão do SteamSpy (`lastPage`). `game-query` não lê nem escreve esse item diretamente.

## Endpoints (rotas locais via `src/local-server.ts`)

### `GET /game-query`
Handler: `src/query.ts`
Lista jogos do dia atual (dateAdded), paginado. Se a tabela não retornar nenhum jogo para o dia, busca a primeira página do SteamSpy (`request=all`) como fallback e retorna esses jogos sem cursor (sem persistir na tabela).
- Query param `cursor` (opcional): cursor de paginação em base64.
- Resposta: `{ count: number, items: GameSummary[], cursor?: string }`

### `GET /game-query/:id`
Handler: `src/get.ts`
Busca um jogo específico pelo `appId` (id da Steam), para a data atual.
- Resposta: `GameSummary` ou `404` se não encontrado.

## Variáveis de ambiente

- `AWS_REGION` — região do DynamoDB (default: `sa-east-1`)
- `PORT` — porta do servidor local (default: `3000`)
