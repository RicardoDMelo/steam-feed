export type GameNews = {
  newsId: string;
  appId: number;
  title: string;
  url: string;
}

export const orderGameNews = (news: GameNews): GameNews => ({
  newsId: news.newsId,
  appId: news.appId,
  title: news.title,
  url: news.url,
});
