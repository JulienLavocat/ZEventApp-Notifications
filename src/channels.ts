import * as twitch from "./twitch";
import channelsDevRaw from "./data/channels-dev.json";
import { HelixUser } from "@twurple/api/lib";
import { IS_DEV } from ".";
import fetch from "node-fetch";

export class Channels {
	private static channels: Map<
		string,
		Pick<HelixUser, "id" | "displayName" | "profilePictureUrl">
	> = new Map();

	static async load() {
		console.log("Loading streamers list");

		if (IS_DEV) {
			console.log("Dev streamers list loading");
			channelsDevRaw.forEach((e) => this.channels.set(e.id, e));
			return;
		}

		const streamersLogins = (
			(await (await fetch("https://zevent.fr/api/")).json()) as {
				live: { twitch: string }[];
			}
		).live.map((e) => e.twitch);

		const streamers = await twitch.apiClient.users.getUsersByNames(
			streamersLogins,
		);

		if (streamers.length !== streamersLogins.length) {
			console.error(streamersLogins, streamers);
			throw new Error("Invalid streamers list");
		}

		streamers.forEach((e) => this.channels.set(e.id, e));
	}

	static getChannels() {
		return this.channels;
	}

	static get(id: string) {
		return this.channels.get(id);
	}
}
