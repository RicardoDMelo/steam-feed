import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import type { GameSummary } from './domain/summary.js';
import { fetchGameSummary } from './handlers/get.js';
import { queryGameSummaries } from './handlers/query.js';
import typeDefs from './schema.cjs';

const resolvers = {
    Query: {
        gameSummaries(_: unknown, { cursor }: { cursor?: string }) {
            return queryGameSummaries(cursor, cursor ? { queryStringParameters: { cursor } } : {});
        },
        gameSummary(_: unknown, { appId }: { appId: number }) {
            return fetchGameSummary(appId);
        },
    },
    GameSummary: {
        __resolveReference(gameSummary: GameSummary) {
            return fetchGameSummary(gameSummary.appId);
        },
    },
};

export const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
});