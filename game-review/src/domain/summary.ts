import { orderGameReview, type GameReview } from "./review.js";

export type GameSummary = {
    appId: number;
    reviews: GameReview[];
}

export const orderGameSummary = (game: GameSummary): GameSummary => ({
    appId: game.appId,
    reviews: game.reviews.map(orderGameReview),
});
