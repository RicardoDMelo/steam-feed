import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from './domain/summary.js';
import { getGames } from './infra/game.repository.js';
import { getSteamSpyPage } from './infra/spy.repository.js';
import { decodeCursor, encodeCursor } from './helpers/cursor.js';
import { sendFailedQueryEvent } from './infra/failed-query.topic.js';

type GameQueryResult = {
    count: number;
    cursor?: string | undefined;
    items: Array<GameSummary>;
}

const pageSize = 50;

const findCursorIndex = (games: Array<GameSummary>, cursor?: Record<string, unknown>): number => {
    if (!cursor) {
        return 0;
    }

    const index = games.findIndex((game) =>
        game.appId === cursor['appId'] &&
        game.owners === cursor['owners'] &&
        game.dateAdded === cursor['dateAdded']
    );

    return index >= 0 ? index : 0;
};

export const handler = async (event: Partial<APIGatewayProxyEventV2>, _context: Context): Promise<GameQueryResult> => {
    console.log('game-query: query request', event);

    const exclusiveStartKey = decodeCursor(event?.queryStringParameters?.cursor);

    const dbResult = await getGames(exclusiveStartKey, pageSize);

    if (dbResult.items.length > 0) {
        return { count: dbResult.items.length, cursor: dbResult.lastEvaluatedKey ? encodeCursor(dbResult.lastEvaluatedKey) : event?.queryStringParameters?.cursor, items: dbResult.items.map(orderGameSummary) };
    }

    console.warn('game-query: no games found for query, falling back to steamspy', event);
    await sendFailedQueryEvent(event);

    const fallbackGames = await getSteamSpyPage();
    const startIndex = findCursorIndex(fallbackGames, exclusiveStartKey);
    const fallbackItems = fallbackGames.slice(startIndex, startIndex + pageSize);

    const nextGame = fallbackGames[startIndex + pageSize];
    const cursor = nextGame ? encodeCursor({ appId: nextGame.appId, owners: nextGame.owners, dateAdded: nextGame.dateAdded }) : undefined;

    return { count: fallbackItems.length, cursor, items: fallbackItems.map(orderGameSummary) };
};
