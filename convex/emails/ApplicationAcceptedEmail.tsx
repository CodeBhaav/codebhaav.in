import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, fonts, Layout, tokens } from "./Layout";

interface ApplicationAcceptedEmailProps {
	name: string;
}

export function ApplicationAcceptedEmail({
	name,
}: ApplicationAcceptedEmailProps) {
	return (
		<Layout preview={`You're in. Welcome to the CodeBhaav founding cohort, ${name}.`}>
			<Text
				style={{ ...eyebrowStyle, color: tokens.amber, marginBottom: 14 }}
			>
				Founding member · Accepted
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
				You're in, {name}.
			</Heading>
			<Text
				style={{
					margin: "0 0 16px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				We've reviewed your application and we're excited to bring you on as
				a founding member of CodeBhaav. You're now part of the original
				cohort that shapes what this community becomes.
			</Text>
			<Text
				style={{
					margin: "0 0 28px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				We'll reach out within the next few days with a short intro call to
				walk you through next steps. In the meantime, your dashboard is the
				home base.
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

			<Section
				style={{
					marginTop: 28,
					background: tokens.panelInset,
					border: `1px solid ${tokens.border}`,
					padding: "18px 22px",
				}}
			>
				<Text
					style={{
						margin: "0 0 8px 0",
						fontFamily: fonts.mono,
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: tokens.amber,
					}}
				>
					What happens next
				</Text>
				<Text
					style={{
						margin: 0,
						fontSize: 14,
						lineHeight: 1.6,
						color: tokens.textSecondary,
					}}
				>
					Watch this inbox for a calendar link from us. Reply directly to that
					email if anything comes up before then.
				</Text>
			</Section>
		</Layout>
	);
}

ApplicationAcceptedEmail.PreviewProps = {
	name: "Pranav",
} satisfies ApplicationAcceptedEmailProps;

export default ApplicationAcceptedEmail;
