import { config } from "dotenv";
config();
import * as admin from "firebase-admin";
import { collectGames } from "./gamesCollector";
import * as twitch from "./twitch";

admin.initializeApp({
	credential: admin.credential.cert("./service-account.json"),
	databaseURL: "https://zevent-33dd3.firebaseio.com",
});

(async () => {
	console.log("Deleting previous subscriptions...");
	// await twitch.apiClient.eventSub.deleteAllSubscriptions();
	console.log("Subscriptions successfuly deleted !");

	// await twitch.listener.listen();

	// await Subscriptions.subscribeToAll();

	await collectGames();

	console.log(
		`Subscribed to ${
			(await twitch.apiClient.eventSub.getSubscriptions()).total
		} events`,
	);
})().catch((err) => {
	console.error(err);
	process.exit(-1);
});
