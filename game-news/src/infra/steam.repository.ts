import type { GameNews } from "../domain/news";


type SteamReview = {
    gid: string;
    title: string;
    url: string;
}

type SteamAppNews = {
    appId: number;
    newsitems: SteamReview[];
    count: number;
}

type SteamAppNewsResponse = {
    appnews: SteamAppNews;
}

export const getSteamNews = async (appId: number): Promise<Array<GameNews>> => {
    console.log('game-news: steam appnews request', { appId });
    const response = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=5&maxlength=300&format=json`);
    const data = await response.json() as SteamAppNewsResponse;

    return data.appnews.newsitems.map((review) => ({
        newsId: review.gid,
        appId,
        title: review.title,
        url: review.url,
    }));
};
