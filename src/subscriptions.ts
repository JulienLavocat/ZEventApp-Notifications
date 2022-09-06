import {
	EventSubChannelUpdateEvent,
	EventSubStreamOnlineEvent,
} from "@twurple/eventsub/lib";
import * as admin from "firebase-admin";
import { NotificationMessagePayload } from "firebase-admin/lib/messaging/messaging-api";
import { IS_DEV } from ".";
import { Channels } from "./channels";
import * as twitch from "./twitch";

const messaging = admin.messaging();

function sendToTopics(
	topics: string[],
	content: {
		titleFormat: string;
		displayName: string;
		name: string;
		profileUrl?: string;
		game?: string;
		body?: string;
	},
) {
	console.log(`Sending to ${topics}:`, content);
	return topics.map((e) => {
		const notification: NotificationMessagePayload = {
			title: content.titleFormat
				.replace(/%s%/g, content.displayName)
				.replace(/%g%/g, content.game || ""),
			image: content.profileUrl || "",
		};

		if (content.body) notification.body = content.body; // Can't set it directly in notification payload, SDK consider undefined as an invalid value for some reason

		messaging.sendToTopic(e, {
			notification,
			data: {
				twitch: content.name,
			},
		});
	});
}

export class Subscriptions {
	static games: Map<string, { game: string; profileUrl: string }> = new Map();

	static async subscribeToAll() {
		const promises = Array.from(Channels.getChannels().values()).map(
			async (e) => {
				await twitch.listener.subscribeToStreamOnlineEvents(e.id, (e) =>
					this.onStreamOnline(e),
				);

				await twitch.listener.subscribeToChannelUpdateEvents(
					e.id,
					(e) => this.onChannelUpdate(e),
				);

				console.log("Subscribed to " + e.displayName);
			},
		);

		await Promise.all(promises);
		console.log("Successfuly subscribed to all streamers");

		// if (IS_DEV) {
		// 	setInterval(() => {
		// 		sendToTopics(["dev", "dev.online.zerator"], {
		// 			titleFormat: "%s% à lancé son stream !",
		// 			displayName: "ZeratoR",
		// 			name: "zerator",
		// 			profileUrl: Channels.get("41719107")?.profilePictureUrl,
		// 		});
		// 	}, 10000);
		// }
	}

	static onStreamOnline(e: EventSubStreamOnlineEvent) {
		console.log(`${e.broadcasterDisplayName} just went live!`);
		sendToTopics(["online", `online.${e.broadcasterName}`], {
			titleFormat: "%s% à lancé son stream !",
			displayName: e.broadcasterDisplayName,
			name: e.broadcasterName,
			profileUrl: Channels.get(e.broadcasterId)?.profilePictureUrl,
		});
	}
	static async onChannelUpdate(e: EventSubChannelUpdateEvent) {
		let broadcasterData = this.games.get(e.broadcasterName);
		if (broadcasterData?.game !== e.categoryId) {
			if (!broadcasterData) {
				const profile = await e.getBroadcaster();
				broadcasterData = {
					game: e.categoryId,
					profileUrl: profile.profilePictureUrl,
				};
				this.games.set(e.broadcasterName, broadcasterData);
			} else {
				this.games.set(e.broadcasterName, {
					...broadcasterData,
					game: e.categoryId,
				});
			}

			console.log(`${e.broadcasterName} joue à ${e.categoryName}`);

			sendToTopics(["game", `game.${e.categoryId}`], {
				titleFormat: `%s% joue à %g% !`,
				displayName: e.broadcasterDisplayName,
				name: e.broadcasterName,
				profileUrl: Channels.get(e.broadcasterId)?.profilePictureUrl,
				body: `${e.streamTitle}`,
				game: e.categoryName,
			});
		}
	}
}
