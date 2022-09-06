import { config } from "dotenv";
import * as admin from "firebase-admin";
config();
admin.initializeApp({
	credential: admin.credential.cert("./service-account.json"),
	databaseURL: "https://zevent-33dd3.firebaseio.com",
});
import { Subscriptions } from "./subscriptions";
import * as twitch from "./twitch";
import { Channels } from "./channels";

export const IS_DEV = process.env.NODE_ENV !== "prod";

(async () => {
	console.log("Deleting previous subscriptions...");
	await twitch.apiClient.eventSub.deleteAllSubscriptions();
	console.log("Subscriptions successfuly deleted !");

	await Channels.load();

	console.log("Streamers list loaded");

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
