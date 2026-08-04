import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import type { GameSummary } from './domain/summary.js';
import { fetchGameSummary } from './handlers/get.js';
import { queryGameSummaries } from './handlers/query.js';

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  type Query {
    gameSummaries(cursor: String): GameSummaryConnection!
    gameSummary(appId: Int!): GameSummary
  }

  type GameSummaryConnection {
    count: Int!
    cursor: String
    items: [GameSummary!]!
  }

  type GameSummary
    @key(fields: "appId") {
    appId: Int!
    name: String!
    developer: String
    publisher: String
    positive: Int
    negative: Int
    owners: Int
    dateAdded: String!
  }
`;

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