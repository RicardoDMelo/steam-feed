import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import type { GameSummary } from './domain/summary.js';
import { queryGameReviews } from './handlers/query.js';

const typeDefs = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  type Query {
    gameReviews(appId: Int!, language: String): [GameReview!]!
  }

  type GameReview {
    recommendationId: Int!
    appId: Int!
    review: String!
    language: String!
    votesUp: Int!
  }

  type GameSummary
    @key(fields: "appId") {
    appId: Int!
    reviews: [GameReview]
  }
`;

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
