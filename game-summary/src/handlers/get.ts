import { orderGameSummary, type GameSummary } from '../domain/summary.js';
import { getGameByAppId } from '../infra/game.repository.js';

export const fetchGameSummary = async (appId: number): Promise<GameSummary | undefined> => {
    console.log('game-query: get request', { appId });
    const game = await getGameByAppId(appId);
    return game ? orderGameSummary(game) : undefined;
}
