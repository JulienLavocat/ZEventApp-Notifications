import * as twitch from "./twitch";
import * as elastic from "./elasticsearch";

export async function collectGames() {
	await elastic.ensureIndex();

	const paginator = twitch.apiClient.games.getTopGamesPaginated();

	let i = 0;
	let gamesCount = 0;
	while ((await paginator.getNext()).length > 0) {
		if (!paginator.current) break;
		await elastic.bulkInsertGames(paginator.current);
		i++;
		gamesCount += paginator.current.length;
	}

	console.log("Collected " + gamesCount + " games");
}
