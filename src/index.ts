import { config } from "dotenv";
import * as admin from "firebase-admin";
config();

admin.initializeApp({
	credential: admin.credential.cert("./service-account.json"),
	databaseURL: "https://zevent-33dd3.firebaseio.com",
});

import { Subscriptions } from "./subscriptions";
import * as twitch from "./twitch";
import { writeFileSync } from "fs";

(async () => {
	console.log("Deleting previous subscriptions...");
	await twitch.apiClient.eventSub.deleteAllSubscriptions();
	console.log("Subscriptions successfuly deleted !");

	// const paginator = await twitch.apiClient.games
	// 	.getTopGamesPaginated()
	// 	.getAll();
	// writeFileSync(
	// 	"src/data/games/all.json",
	// 	JSON.stringify(paginator, null, 2),
	// );

	// console.log(require("./data/games/all.json").length);

	// let i = 0;
	// while ((await paginator.getNext()).length > 0) {
	// 	console.log((paginator.current as any[])[0]);
	// 	writeFileSync(
	// 		"src/data/games/page" + i + ".json",
	// 		JSON.stringify(paginator.current, null, 2),
	// 	);
	// 	i++;
	// }

	await twitch.listener.listen();

	await Subscriptions.subscribeToAll();

	console.log(
		`Subscribed to ${
			(await twitch.apiClient.eventSub.getSubscriptions()).total
		} events`,
	);
})().catch((err) => {
	console.error(err);
	process.exit(-1);
});
