import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import type { GameSummary } from './domain/summary.js';
import { queryGameNews } from './handlers/query.js';
import typeDefs from './schema.cjs';

const resolvers = {
    Query: {
        gameNews(_: unknown, { appId }: { appId: number }) {
            return queryGameNews(appId);
        },
    },
    GameSummary: {
        __resolveReference(gameSummary: GameSummary) {
            return { appId: gameSummary.appId, news: queryGameNews(gameSummary.appId) };
        },
    },
};

export const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
