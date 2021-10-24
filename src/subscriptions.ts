import {
	EventSubChannelUpdateEvent,
	EventSubStreamOfflineEvent,
	EventSubStreamOnlineEvent,
	EventSubSubscription,
} from "@twurple/eventsub/lib";
import * as admin from "firebase-admin";
import channelsRaw from "./data/channels.json";
import channelsDevRaw from "./data/channels-dev.json";
import * as twitch from "./twitch";
import { NotificationMessagePayload } from "firebase-admin/lib/messaging/messaging-api";

interface Channel {
	id: string;
	login: string;
	display_name: string;
	type: string;
	broadcaster_type: string;
	description: string;
	profile_image_url: string;
	offline_image_url: string;
	view_count: number;
	created_at: string;
}

const IS_DEV = process.env.NODE_ENV === "development";

const channels: Map<string, Channel> = new Map();
IS_DEV
	? channelsDevRaw.forEach((e) => channels.set(e.id, e as Channel))
	: channelsRaw.forEach((e) => channels.set(e.id, e));

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
		const promises = Array.from(channels.values()).map(async (e) => {
			await twitch.listener.subscribeToStreamOnlineEvents(e.id, (e) =>
				this.onStreamOnline(e),
			);

			await twitch.listener.subscribeToChannelUpdateEvents(e.id, (e) =>
				this.onChannelUpdate(e),
			);

			console.log("Subscribed to " + e.display_name);
		});

		await Promise.all(promises);
		console.log("Successfuly subscribed to all streamers");

		if (IS_DEV) {
			setInterval(() => {
				sendToTopics(["online", "online.zerator"], {
					titleFormat: "%s% à lancé son stream !",
					displayName: "ZeratoR",
					name: "zerator",
					profileUrl: channels.get("41719107")?.profile_image_url,
				});
			}, 10000);
		}
	}

	static onStreamOnline(e: EventSubStreamOnlineEvent) {
		console.log(`${e.broadcasterDisplayName} just went live!`);
		sendToTopics(["online", `online.${e.broadcasterName}`], {
			titleFormat: "%s% à lancé son stream !",
			displayName: e.broadcasterDisplayName,
			name: e.broadcasterName,
			profileUrl: channels.get(e.broadcasterId)?.profile_image_url,
		});
	}
	static onChannelUpdate(e: EventSubChannelUpdateEvent) {
		console.log(`${e.broadcasterDisplayName} joue à ${e.categoryName} !`);
		this.notifyGame(e);
	}

	static async notifyGame(e: EventSubChannelUpdateEvent) {
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

			console.log(
				"Notifying topics: ",
				`game.${e.categoryId}`,
				`game.${e.broadcasterName}.${e.categoryId}`,
				e.categoryName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
			);

			sendToTopics(["game", `game.${e.categoryId}`], {
				titleFormat: `%s% joue à %g% !`,
				displayName: e.broadcasterDisplayName,
				name: e.broadcasterName,
				profileUrl: channels.get(e.broadcasterId)?.profile_image_url,
				body: `${e.streamTitle}`,
				game: e.categoryName,
			});
		}
	}
}
