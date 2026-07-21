import type { Context } from 'aws-lambda';
import { clearGames } from './infra/game.repository.js';

type GameClearResult = {
    deleted: number;
}

export const handler = async (_event: unknown, _context: Context): Promise<GameClearResult> => {
    const deleted = await clearGames();
    return { deleted };
};
