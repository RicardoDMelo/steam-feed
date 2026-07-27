import type { Context } from 'aws-lambda';
import { clearGames } from './infra/game.repository.js';

type GameClearResult = {
    deleted: number;
}

export const handler = async (_event: unknown, _context: Context): Promise<GameClearResult> => {
    console.log('steam-fetch: clear all games from database');
    const deleted = await clearGames();
    return { deleted };
};
