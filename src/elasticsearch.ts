import { Client } from "@elastic/elasticsearch";
import { HelixGameData } from "@twurple/api/lib/api/helix/game/HelixGame";

const elasticIndex = "games_autocomplete";

const elastic = new Client({
	node: process.env.ELASTIC_HOST,
});

export const ensureIndex = () =>
	elastic.indices.create(
		{
			index: elasticIndex,
			body: {
				mappings: {
					properties: {
						id: { type: "text" },
						name: { type: "search_as_you_type" },
						boxArtUrl: { type: "text" },
					},
				},
			},
		},
		{ ignore: [400] },
	);

export const bulkInsertGames = (games: HelixGameData[]) =>
	elastic.bulk({
		refresh: true,
		body: games.flatMap((game) => [
			{ index: { _index: elasticIndex, _id: game.id } },
			{
				id: game.id,
				name: game.name,
				boxArtUrl: game.box_art_url,
			},
		]),
	});
