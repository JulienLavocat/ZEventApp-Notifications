import { config } from "dotenv";
import * as admin from "firebase-admin";
config();
admin.initializeApp({
	credential: admin.credential.cert("./service-account.json"),
	databaseURL: "https://zevent-33dd3.firebaseio.com",
});
import { collectGames } from "./gamesCollector";
import { Subscriptions } from "./subscriptions";
import * as twitch from "./twitch";

(async () => {
	console.log("Deleting previous subscriptions...");
	await twitch.apiClient.eventSub.deleteAllSubscriptions();
	console.log("Subscriptions successfuly deleted !");

	await twitch.listener.listen();

	await Subscriptions.subscribeToAll();

	collectGames();
	setInterval(() => collectGames(), 3600 * 1000);

	console.log(
		`Subscribed to ${
			(await twitch.apiClient.eventSub.getSubscriptions()).total
		} events`,
	);
})().catch((err) => {
	console.error(err);
	process.exit(-1);
});
