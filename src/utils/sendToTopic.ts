import * as admin from "firebase-admin";
import { NotificationMessagePayload } from "firebase-admin/lib/messaging/messaging-api";
import { IS_DEV } from "..";
import crypto from "crypto";

const messaging = admin.messaging();

export function sendToTopics(
	topics: string[],
	content: {
		titleFormat: string;
		displayName: string;
		name: string;
		profileUrl?: string;
		game?: string;
		body?: string;
		action?: string;
	},
) {
	console.log(
		new Date().toISOString(),
		`Sending to ${topics.map((e) => (IS_DEV ? `dev.${e}` : e))}:`,
		content,
	);

	const title = content.titleFormat
		.replace(/%s%/g, content.displayName)
		.replace(/%g%/g, content.game || "");

	const notification: NotificationMessagePayload = {
		title,
		image: content.profileUrl || "",
		sound: "default",
		clickAction: content.action,
		tag: crypto
			.createHash("sha256")
			.update(title + Date.now())
			.digest("hex"),
	};
	if (content.body) notification.body = content.body;

	return topics.map((e) => {
		messaging.sendToTopic(IS_DEV ? `dev.${e}` : e, {
			notification,
			data: {
				twitch: content.name,
			},
		});
	});
}
