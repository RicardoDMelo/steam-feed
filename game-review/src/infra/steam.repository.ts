import type { GameReview } from "../domain/review.js";

type SteamReview = {
    recommendationid: string;
    language: string;
    review: string;
    votes_up: number;
}

type SteamAppReviewsResponse = {
    success: number;
    reviews: Array<SteamReview>;
}

export const getSteamReviews = async (appId: number, language = 'english'): Promise<Array<GameReview>> => {
    console.log('game-review: steam appreviews request', { appId, language });

    const response = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=${language}`);
    const data = await response.json() as SteamAppReviewsResponse;

    return data.reviews.map((review) => ({
        recommendationId: Number(review.recommendationid),
        appId,
        review: review.review,
        language: review.language,
        votesUp: review.votes_up,
    }));
};
