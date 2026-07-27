import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from './domain/summary.js';
import { getGames } from './infra/game.repository.js';
import { decodeCursor, encodeCursor } from './helpers/cursor.js';
import { sendFailedQueryEvent } from './infra/failed-query.topic.js';

type GameQueryResult = {
    count: number;
    cursor?: string | undefined;
    items: Array<GameSummary>;
}

const pageSize = 100;

export const handler = async (event: Partial<APIGatewayProxyEventV2>, _context: Context): Promise<GameQueryResult> => {
    console.log('game-query: query request', event);

    const exclusiveStartKey = decodeCursor(event?.queryStringParameters?.cursor);

    const dbResult = await getGames(exclusiveStartKey, pageSize);

    if (dbResult.items.length === 0) {
        console.warn('game-query: no games found for query', event);
        await sendFailedQueryEvent(event);
    }

    return { count: dbResult.items.length, cursor: encodeCursor(dbResult.lastEvaluatedKey), items: dbResult.items.map(orderGameSummary) };
};
