import { orderGameNews, type GameNews } from "./news.js";

export type GameSummary = {
    appId: number;
    news: GameNews[];
}

export const orderGameSummary = (game: GameSummary): GameSummary => ({
    appId: game.appId,
    news: game.news.map(orderGameNews),
});
