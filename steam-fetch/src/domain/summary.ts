export type GameSummary = {
    appId: number;
    name: string;
    developer: string;
    publisher: string;
    positive: number;
    negative: number;
    owners: number;
    dateAdded: string;
}

export const orderGameSummary = (game: GameSummary): GameSummary => ({
    appId: game.appId,
    name: game.name,
    developer: game.developer,
    publisher: game.publisher,
    positive: game.positive,
    negative: game.negative,
    owners: game.owners,
    dateAdded: game.dateAdded,
});
