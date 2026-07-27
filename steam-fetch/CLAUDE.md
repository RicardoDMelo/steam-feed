# steam-fetch

Serviço serverless (AWS Lambda) que **ingere** dados de jogos da Steam via [SteamSpy](https://steamspy.com/api.php) e gerencia a escrita na tabela DynamoDB `games` — inclusive sua limpeza — a mesma tabela consultada pelo serviço irmão [`game-query`](../game-query/CLAUDE.md), que é somente leitura.

## Stack

- TypeScript, compilado com `esbuild` (bundle CJS, target `node24`)
- Runtime: AWS Lambda (`@types/aws-lambda`)
- Banco: DynamoDB (`@aws-sdk/lib-dynamodb`)
- Servidor local de desenvolvimento com Express (`src/local-server.ts`)

## Scripts

- `npm run build` — gera os bundles dos 2 handlers (`fetch`, `clear`) em `dist/`
- `npm run dev` — sobe o servidor Express local com `tsx watch` (hot reload)
- `npm run start` — roda `dist/index.js` (produção)

## Estrutura

- `src/fetch.ts`, `src/clear.ts` — handlers Lambda (um arquivo por endpoint)
- `src/local-server.ts` — wrapper Express que expõe os handlers como rotas HTTP para dev local
- `src/domain/summary.ts` — tipo `GameSummary` (modelo principal de jogo; duplicado de `game-query`, já que os dois pacotes são projetos npm independentes, sem workspace compartilhado)
- `src/infra/spy.repository.ts` — integração com a API do SteamSpy (fetch + parse da página)
- `src/infra/game.repository.ts` — escrita no DynamoDB: grava os jogos da página (`writeGames`), o cursor de paginação da ingestão (`getSteamSpyLastPage`/`setSteamSpyLastPage`) e a limpeza da tabela (`clearGames`)
- `src/helpers/date.ts` — data atual no formato `YYYY-MM-DD`, usada como chave de partição

## Modelo de dados

Tabela DynamoDB `games` (compartilhada com `game-query`), chave primária composta `appId` (partition) + `dateAdded` (sort). Um item sentinela reservado (`appId = -1`, mesma partição do dia atual) guarda o cursor de paginação da ingestão do SteamSpy (`lastPage`) — é lido e atualizado a cada chamada de `/steam-fetch`.

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

## Endpoints (rotas locais via `src/local-server.ts`)

### `POST /steam-fetch`
Handler: `src/fetch.ts`
Busca a próxima página do SteamSpy (`lastPage + 1`), grava os jogos retornados na tabela `games` e avança o cursor de paginação. Sempre persiste — não há modo dry-run.
- Resposta: `{ count: number }`

### `DELETE /steam-fetch`
Handler: `src/clear.ts`
Limpa todos os itens da tabela `games` (scan + delete em lote).
- Resposta: `{ deleted: number }`

## Variáveis de ambiente

- `AWS_REGION` — região do DynamoDB (default: `sa-east-1`)
- `PORT` — porta do servidor local (default: `3001`)
