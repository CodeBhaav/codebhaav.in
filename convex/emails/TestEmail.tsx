import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, fonts, Layout, tokens } from "./Layout";

interface TestEmailProps {
	sentAt?: string;
}

export function TestEmail({
	sentAt = new Date().toISOString(),
}: TestEmailProps) {
	return (
		<Layout preview="Pipeline check from your CodeBhaav Convex deployment.">
			<Text style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}>
				System · Test
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
				Pipeline check.
			</Heading>
			<Text
				style={{
					margin: "0 0 28px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				If you're reading this, the Convex &rarr; Resend email pipeline is
				wired up correctly. Real waitlist and founding-member signups will
				use the same dark, framed style as this email.
			</Text>

			{/* Mono metadata block — like a code block on the landing page */}
			<Section
				style={{
					background: tokens.panelInset,
					border: `1px solid ${tokens.border}`,
					padding: "16px 18px",
				}}
			>
				<MetaRow label="Source" value="email:sendTestEmail" />
				<MetaRow label="Sent" value={sentAt} last />
			</Section>
		</Layout>
	);
}

function MetaRow({
	label,
	value,
	last,
}: {
	label: string;
	value: string;
	last?: boolean;
}) {
	return (
		<Text
			style={{
				margin: 0,
				marginBottom: last ? 0 : 6,
				fontFamily: fonts.mono,
				fontSize: 12,
				lineHeight: 1.5,
			}}
		>
			<span
				style={{
					color: tokens.textMuted,
					letterSpacing: "0.05em",
					textTransform: "uppercase",
					fontSize: 10,
					marginRight: 12,
				}}
			>
				{label}
			</span>
			<span style={{ color: tokens.textSecondary }}>{value}</span>
		</Text>
	);
}

TestEmail.PreviewProps = {
	sentAt: "2026-05-08T20:53:00.000Z",
} satisfies TestEmailProps;

export default TestEmail;
