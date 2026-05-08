"use node";

import { v } from "convex/values";
import * as React from "react";
import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { AccountWelcomeEmail } from "./emails/AccountWelcomeEmail";
import { FoundingMemberEmail } from "./emails/FoundingMemberEmail";
import { TestEmail } from "./emails/TestEmail";
import { WaitlistEmail } from "./emails/WaitlistEmail";

const FROM = "CodeBhaav <noreply@codebhaav.in>";
const SITE_URL = "https://www.codebhaav.in";

function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error("RESEND_API_KEY environment variable is not set");
	}
	return new Resend(apiKey);
}

export const sendWaitlistEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
		position: v.number(),
		referralCode: v.string(),
	},
	handler: async (_ctx, args) => {
		const referralLink = `${SITE_URL}/waitlist?ref=${args.referralCode}`;

		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `You're #${args.position} on the CodeBhaav waitlist`,
			react: (
				<WaitlistEmail
					name={args.name}
					position={args.position}
					referralLink={referralLink}
				/>
			),
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendFoundingMemberEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `We received your application, ${args.name}`,
			react: <FoundingMemberEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendAccountWelcomeEmail = internalAction({
	args: {
		name: v.string(),
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: `Welcome to CodeBhaav, ${args.name}`,
			react: <AccountWelcomeEmail name={args.name} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});

export const sendTestEmail = internalAction({
	args: {
		email: v.string(),
	},
	handler: async (_ctx, args) => {
		const result = await getResend().emails.send({
			from: FROM,
			to: args.email,
			subject: "[Test] CodeBhaav email pipeline check",
			react: <TestEmail sentAt={new Date().toISOString()} />,
		});

		if (result.error) {
			throw new Error(
				`Resend error: ${result.error.name} — ${result.error.message}`,
			);
		}
	},
});
