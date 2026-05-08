import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, Layout, tokens } from "./Layout";

interface ApplicationRejectedEmailProps {
	name: string;
}

export function ApplicationRejectedEmail({
	name,
}: ApplicationRejectedEmailProps) {
	return (
		<Layout preview="An update on your CodeBhaav founding-member application.">
			<Text
				style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}
			>
				Founding member · Update
			</Text>
			<Heading
				as="h1"
				style={{
					margin: "0 0 12px 0",
					fontSize: 28,
					lineHeight: 1.15,
					fontWeight: 700,
					letterSpacing: "-0.015em",
					color: tokens.text,
				}}
			>
				Thanks for applying, {name}.
			</Heading>
			<Text
				style={{
					margin: "0 0 16px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				We've reviewed your application carefully, and we're not able to
				bring you into the founding cohort right now. The cohort is small by
				design and we had to make some tough calls.
			</Text>
			<Text
				style={{
					margin: "0 0 16px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				This isn't a closed door. You're still on the waitlist, and the
				platform will open up to everyone soon. We'd genuinely love to see
				what you build once it does.
			</Text>
			<Text
				style={{
					margin: 0,
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Thanks for being part of CodeBhaav.
			</Text>
		</Layout>
	);
}

ApplicationRejectedEmail.PreviewProps = {
	name: "Pranav",
} satisfies ApplicationRejectedEmailProps;

export default ApplicationRejectedEmail;
