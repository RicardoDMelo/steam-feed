import { orderGameReview, type GameReview } from '../domain/review.js';
import { getSteamReviews } from '../infra/steam.repository.js';

export const queryGameReviews = async (appId: number, language?: string): Promise<Array<GameReview>> => {
    console.log('game-review: gameReviews request', { appId, language });
    const reviews = await getSteamReviews(appId, language);
    return reviews.map(orderGameReview);
};
