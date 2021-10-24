import { ApiClient } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { NgrokAdapter } from "@twurple/eventsub-ngrok";
import { EventSubListener, ReverseProxyAdapter } from "@twurple/eventsub";
import crypto from "crypto";

const secret = crypto.randomBytes(48).toString("hex");

const apiClient = new ApiClient({
	authProvider: new ClientCredentialsAuthProvider(
		process.env.TWITCH_ID || "",
		process.env.TWITCH_SECRET || "",
	),
});

const adapter =
	process.env.NODE_ENV === "development"
		? new NgrokAdapter()
		: new ReverseProxyAdapter({
				hostName: process.env.HELIX_HOST || "",
				port: parseInt(process.env.port || "3444"),
		  });

const listener = new EventSubListener({
	apiClient,
	adapter,
	secret,
});

export { apiClient, listener };
