import { orderGameNews, type GameNews } from '../domain/news.js';
import { getSteamNews } from '../infra/steam.repository.js';

export const queryGameNews = async (appId: number): Promise<Array<GameNews>> => {
    console.log('game-news: gameNews request', { appId });
    const news = await getSteamNews(appId);
    return news.map(orderGameNews);
};
