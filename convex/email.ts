"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

async function sendEmail(payload: {
	from: string;
	to: string;
	subject: string;
	html: string;
}): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY environment variable is not set");
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Failed to send email: ${response.status} ${errorBody}`);
	}
}

export const sendWaitlistEmail = action({
	args: {
		name: v.string(),
		email: v.string(),
		position: v.number(),
		referralCode: v.string(),
		baseUrl: v.string(),
	},
	handler: async (_ctx, args) => {
		const referralLink = `${args.baseUrl}/waitlist?ref=${args.referralCode}`;

		const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #0d9488;">Welcome to CodeBhaav!</h1>
  <p>Hey ${args.name},</p>
  <p>Thanks for joining the CodeBhaav waitlist! You are <strong>#${args.position}</strong> in line.</p>
  <p>Share your referral link to move up the list:</p>
  <p style="background: #f0fdfa; padding: 12px; border-radius: 8px; word-break: break-all;">
    <a href="${referralLink}" style="color: #0d9488;">${referralLink}</a>
  </p>
  <p>We will be in touch soon with updates. Stay tuned!</p>
  <p style="margin-top: 32px;">— The CodeBhaav Team</p>
</body>
</html>`.trim();

		await sendEmail({
			from: "CodeBhaav <noreply@codebhaav.in>",
			to: args.email,
			subject: `Welcome to CodeBhaav, ${args.name}!`,
			html,
		});
	},
});

export const sendFoundingMemberEmail = action({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #0d9488;">Thank You for Applying!</h1>
  <p>Hey ${args.name},</p>
  <p>We have received your founding member application for CodeBhaav. Thank you for your interest in being part of our core team!</p>
  <p>We will review your application carefully and get back to you soon.</p>
  <p style="margin-top: 32px;">— The CodeBhaav Team</p>
</body>
</html>`.trim();

		await sendEmail({
			from: "CodeBhaav <noreply@codebhaav.in>",
			to: args.email,
			subject: `Thank you for applying, ${args.name}!`,
			html,
		});
	},
});
