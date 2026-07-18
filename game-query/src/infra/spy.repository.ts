import type { GameSummary } from "../domain/summary.js";
import { getCurrentDate } from "../helpers/date.js";
import { getSteamSpyLastPage, setSteamSpyLastPage } from "./game.repository.js";

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

export const getNextSteamSpyPage = async (): Promise<Array<GameSummary>> => {
	const lastPage = await getSteamSpyLastPage();
	const page = lastPage + 1;

	const response = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`);
	const games = await response.json() as Record<string, SteamSpyGame>;

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
			dateAdded: getCurrentDate(),
		});
	}

	await setSteamSpyLastPage(page);

	return result.sort((a, b) => b.owners - a.owners);
};
