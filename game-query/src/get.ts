import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from './domain/summary.js';
import { getGameByAppId } from './infra/game.repository.js';

export const handler = async (event: Partial<APIGatewayProxyEventV2>, _context: Context): Promise<GameSummary | undefined> => {
    console.log('game-query: get request', event);

    const game = await getGameByAppId(Number(event.pathParameters?.id));
    return game ? orderGameSummary(game) : undefined;
};
