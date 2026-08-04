import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from '../domain/summary.js';
import { getGames } from '../infra/game.repository.js';
import { getSteamSpyPage } from '../infra/spy.repository.js';
import { decodeCursor, encodeCursor } from '../helpers/cursor.js';
import { sendFailedQueryEvent } from '../infra/failed-query.topic.js';

type GameQueryResult = {
    count: number;
    cursor?: string | undefined;
    items: Array<GameSummary>;
}

const pageSize = 10;

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

export const queryGameSummaries = async (cursor: string | undefined, event: Partial<APIGatewayProxyEventV2>): Promise<GameQueryResult> => {
    console.log('game-query: gameSummaries request', { cursor });
    const exclusiveStartKey = decodeCursor(cursor);

    const dbResult = await getGames(exclusiveStartKey, pageSize);

    if (dbResult.items.length > 0) {
        if (!dbResult.lastEvaluatedKey) {
            await sendFailedQueryEvent(event);
        }
        return { count: dbResult.items.length, cursor: dbResult.lastEvaluatedKey ? encodeCursor(dbResult.lastEvaluatedKey) : cursor, items: dbResult.items.map(orderGameSummary) };
    }

    console.warn('game-query: no games found for query, falling back to steamspy', event);
    await sendFailedQueryEvent(event);

    const fallbackGames = await getSteamSpyPage();
    const startIndex = findCursorIndex(fallbackGames, exclusiveStartKey);
    const fallbackItems = fallbackGames.slice(startIndex, startIndex + pageSize);

    const nextGame = fallbackGames[startIndex + pageSize];
    const nextCursor = nextGame ? encodeCursor({ appId: nextGame.appId, owners: nextGame.owners, dateAdded: nextGame.dateAdded }) : undefined;

    return { count: fallbackItems.length, cursor: nextCursor, items: fallbackItems.map(orderGameSummary) };
};
