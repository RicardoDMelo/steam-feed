import type { Context } from 'aws-lambda';
import type { GameSummary } from './domain/summary.js';
import { getGameByAppId } from './infra/game.repository.js';

type GameGetEvent = {
    id: number;
}

export const handler = async (event: GameGetEvent, context: Context): Promise<GameSummary | undefined> => {
    return getGameByAppId(event.id);
};
