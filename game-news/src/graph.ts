import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import type { GameSummary } from './domain/summary.js';
import { queryGameNews } from './handlers/query.js';

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  type Query {
    gameNews(appId: Int!): [GameNews!]!
  }

  type GameNews {
    newsId: String!
    appId: Int!
    title: String!
    url: String!
  }

  type GameSummary
    @key(fields: "appId") {
    appId: Int!
    news: [GameNews]
  }
`;

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
