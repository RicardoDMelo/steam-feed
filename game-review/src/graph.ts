import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import type { GameSummary } from './domain/summary.js';
import { queryGameReviews } from './handlers/query.js';
import typeDefs from './schema.cjs';

const resolvers = {
    Query: {
        gameReviews(_: unknown, { appId, language }: { appId: number, language?: string }) {
            return queryGameReviews(appId, language);
        },
    },
    GameSummary: {
        __resolveReference(gameSummary: GameSummary) {
            return { appId: gameSummary.appId, reviews: queryGameReviews(gameSummary.appId) };
        },
    },
};

export const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
