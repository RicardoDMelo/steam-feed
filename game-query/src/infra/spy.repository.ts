import type { GameSummary } from "../domain/summary.js";
import { getCurrentDate } from "../helpers/date.js";

type SteamSpyGame = {
	appid: number;
	name: string;
	developer: string;
	publisher: string;
	positive: number;
	negative: number;
	owners: string;
}

const parseOwners = (owners: string): number => {
	const parts = owners.split('..');
	return Number((parts[parts.length - 1] ?? '').trim().replaceAll(',', '')) || 0;
}

export const getSteamSpyPage = async (page = 0): Promise<Array<GameSummary>> => {
	console.log('game-query: steamspy fallback request', { page });

	const response = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`);
	const games = await response.json() as Record<string, SteamSpyGame>;

	const dateAdded = getCurrentDate();
	const result: Array<GameSummary> = [];

	for (const game of Object.values(games)) {
		result.push({
			appId: game.appid,
			name: game.name,
			developer: game.developer,
			publisher: game.publisher,
			positive: game.positive,
			negative: game.negative,
			owners: parseOwners(game.owners),
			dateAdded,
		});
	}

	return result.sort((a, b) => b.owners - a.owners);
};
