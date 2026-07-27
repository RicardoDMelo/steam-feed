import type { Context } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from './domain/summary.js';
import { getGames } from './infra/game.repository.js';
import { decodeCursor, encodeCursor } from './helpers/cursor.js';

type GameQueryEvent = {
    cursor?: string;
}

type GameQueryResult = {
    count: number;
    cursor?: string | undefined;
    items: Array<GameSummary>;
}

const pageSize = 400;

export const handler = async (event: GameQueryEvent, context: Context): Promise<GameQueryResult> => {
    console.log('game-query: query request', event);

    const exclusiveStartKey = decodeCursor(event?.cursor);

    const dbResult = await getGames(exclusiveStartKey, pageSize);
    return { count: dbResult.items.length, cursor: encodeCursor(dbResult.lastEvaluatedKey), items: dbResult.items.map(orderGameSummary) };
};
