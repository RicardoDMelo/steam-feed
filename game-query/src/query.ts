import type { Context } from 'aws-lambda';
import type { GameSummary } from './domain/summary.js';
import { getGames, writeGames } from './infra/game.repository.js';
import { getNextSteamSpyPage } from './infra/spy.repository.js';
import { decodeCursor, encodeCursor } from './helpers/cursor.js';

type GameQueryEvent = {
    cursor?: string;
}

type GameQueryResult = {
    items: Array<GameSummary>;
    cursor?: string | undefined;
}

const pageSize = 20;

export const handler = async (event: GameQueryEvent, context: Context): Promise<GameQueryResult> => {
    const exclusiveStartKey = decodeCursor(event?.cursor);

    const dbResult = await getGames(exclusiveStartKey, pageSize);
    if (dbResult.items.length > 0) {
        return { items: dbResult.items, cursor: encodeCursor(dbResult.lastEvaluatedKey) };
    }

    const gamesFromSteamSpy = await getNextSteamSpyPage();
    await writeGames(gamesFromSteamSpy);

    const dbResultAfterIngestion = await getGames(exclusiveStartKey, pageSize);

    return { items: dbResultAfterIngestion.items, cursor: encodeCursor(dbResultAfterIngestion.lastEvaluatedKey) };
};
