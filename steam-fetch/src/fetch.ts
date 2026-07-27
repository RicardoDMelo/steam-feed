import type { Context } from 'aws-lambda';
import { writeGames } from './infra/game.repository.js';
import { getNextSteamSpyPage } from './infra/spy.repository.js';

type SteamFetchResult = {
    added: number;
}

export const handler = async (_event: unknown, _context: Context): Promise<SteamFetchResult> => {
    console.log('steam-fetch: fetch next steamspy page');

    const games = await getNextSteamSpyPage();

    if (games.length > 0) {
        await writeGames(games);
    }

    return { added: games.length };
};
