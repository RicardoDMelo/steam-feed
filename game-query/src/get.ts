import type { Context } from 'aws-lambda';
import { orderGameSummary, type GameSummary } from './domain/summary.js';
import { getGameByAppId } from './infra/game.repository.js';

type GameGetEvent = {
    id: number;
}

export const handler = async (event: GameGetEvent, context: Context): Promise<GameSummary | undefined> => {
    console.log('game-query: get request', event);

    const game = await getGameByAppId(event.id);
    return game ? orderGameSummary(game) : undefined;
};
