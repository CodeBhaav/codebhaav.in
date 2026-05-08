import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, Layout, tokens } from "./Layout";

interface AccountWelcomeEmailProps {
	name: string;
}

export function AccountWelcomeEmail({ name }: AccountWelcomeEmailProps) {
	return (
		<Layout preview="Your CodeBhaav account is set up.">
			<Text
				style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}
			>
				Account · Welcome
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
				Welcome to CodeBhaav, {name}.
			</Heading>
			<Text
				style={{
					margin: "0 0 28px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Your account is set up. We'll keep you posted as we open up the
				platform. Until then, your dashboard is the place to track your
				waitlist position and share your invite link.
			</Text>

			<Button
				href="https://www.codebhaav.in/dashboard"
				style={{
					background: tokens.amber,
					color: tokens.amberFg,
					padding: "12px 20px",
					fontSize: 14,
					fontWeight: 600,
					textDecoration: "none",
					display: "inline-block",
				}}
			>
				Go to your dashboard →
			</Button>
		</Layout>
	);
}

AccountWelcomeEmail.PreviewProps = {
	name: "Pranav",
} satisfies AccountWelcomeEmailProps;

export default AccountWelcomeEmail;
