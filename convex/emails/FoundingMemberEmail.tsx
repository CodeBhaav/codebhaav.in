import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, fonts, Layout, tokens } from "./Layout";

interface FoundingMemberEmailProps {
	name: string;
}

export function FoundingMemberEmail({ name }: FoundingMemberEmailProps) {
	return (
		<Layout preview="Application received. We'll be in touch within a few days.">
			<Text style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}>
				Founding member · Application
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
				Application received, {name}.
			</Heading>
			<Text
				style={{
					margin: "0 0 16px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Thanks for applying to the CodeBhaav founding cohort. We read every
				application personally &mdash; expect to hear back within a few days.
			</Text>
			<Text
				style={{
					margin: "0 0 28px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				In the meantime, if there's anything you want us to see (a project, a
				write-up, something you're proud of), just reply to this email.
			</Text>

			{/* Inset framed panel — what happens next */}
			<Section
				style={{
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
					We review applications in batches. If we move forward, you'll get
					an email with a short intro-call invite.
				</Text>
			</Section>
		</Layout>
	);
}

FoundingMemberEmail.PreviewProps = {
	name: "Pranav",
} satisfies FoundingMemberEmailProps;

export default FoundingMemberEmail;
