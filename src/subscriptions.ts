import {
	EventSubChannelUpdateEvent,
	EventSubStreamOnlineEvent,
} from "@twurple/eventsub/lib";
import { IS_DEV } from ".";
import { Channels } from "./channels";
import * as twitch from "./twitch";
import { sendToTopics } from "./utils/sendToTopic";

export class Subscriptions {
	static games: Map<string, { game: string; profileUrl: string }> = new Map();

	static async subscribeToAll() {
		const promises = Array.from(Channels.getChannels().values()).map(
			async (e) => {
				const online =
					await twitch.listener.subscribeToStreamOnlineEvents(
						e.id,
						(e) => this.onStreamOnline(e),
					);

				const update =
					await twitch.listener.subscribeToChannelUpdateEvents(
						e.id,
						(e) => this.onChannelUpdate(e),
					);

				if (IS_DEV) {
					console.log(await online.getCliTestCommand());
					console.log(await update.getCliTestCommand());
				}

				console.log("Subscribed to " + e.displayName);
			},
		);

		await Promise.all(promises);
		console.log("Successfuly subscribed to all streamers");
	}

	static onStreamOnline(e: EventSubStreamOnlineEvent) {
		console.log(`${e.broadcasterDisplayName} just went live!`);
		sendToTopics(["online", `online.${e.broadcasterName}`], {
			titleFormat: "%s% à lancé son stream !",
			displayName: e.broadcasterDisplayName,
			name: e.broadcasterName,
			profileUrl: Channels.get(e.broadcasterId)?.profilePictureUrl,
			action: `https://twitch.tv/${e.broadcasterName}`,
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
				action: `https://twitch.tv/${e.broadcasterName}`,
			});
		}
	}
}
