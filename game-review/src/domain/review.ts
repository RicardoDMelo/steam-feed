export type GameReview = {
  recommendationId: number;
  appId: number;
  review: string;
  language: string;
  votesUp: number;
}

export const orderGameReview = (review: GameReview): GameReview => ({
  recommendationId: review.recommendationId,
  appId: review.appId,
  review: review.review,
  language: review.language,
  votesUp: review.votesUp,
});
