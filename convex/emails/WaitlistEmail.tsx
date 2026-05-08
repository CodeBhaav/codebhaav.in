import {
	Button,
	Heading,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, fonts, Layout, tokens } from "./Layout";

interface WaitlistEmailProps {
	name: string;
	position: number;
	referralLink: string;
}

export function WaitlistEmail({
	name,
	position,
	referralLink,
}: WaitlistEmailProps) {
	return (
		<Layout
			preview={`You're #${position} on the CodeBhaav waitlist. Share your invite link to move up.`}
		>
			<Text style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}>
				Waitlist · Welcome
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
					margin: "0 0 28px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Thanks for joining the CodeBhaav waitlist. Here's where you stand:
			</Text>

			{/* Position card — matches the landing page's framed panel style */}
			<Section
				style={{
					background: tokens.amberDarkBg,
					border: `1px solid ${tokens.amber}`,
					padding: "20px 24px",
					margin: "0 0 28px 0",
				}}
			>
				<Text
					style={{
						margin: "0 0 6px 0",
						fontFamily: fonts.mono,
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: tokens.amber,
					}}
				>
					Your spot
				</Text>
				<Text
					style={{
						margin: 0,
						fontSize: 40,
						fontWeight: 700,
						lineHeight: 1,
						letterSpacing: "-0.02em",
						color: tokens.text,
					}}
				>
					#{position}
				</Text>
			</Section>

			<Text
				style={{
					margin: "0 0 20px 0",
					fontSize: 15,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Want to climb the list? Share your invite link &mdash; every signup
				that uses it bumps you up.
			</Text>

			<Button
				href={referralLink}
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
				Open your invite link →
			</Button>

			{/* Copyable URL block — mono, like a code block */}
			<Section
				style={{
					marginTop: 20,
					padding: "12px 16px",
					background: tokens.panelInset,
					border: `1px solid ${tokens.border}`,
				}}
			>
				<Text
					style={{
						margin: "0 0 4px 0",
						fontFamily: fonts.mono,
						fontSize: 10,
						fontWeight: 600,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: tokens.textMuted,
					}}
				>
					Or copy
				</Text>
				<Text
					style={{
						margin: 0,
						fontFamily: fonts.mono,
						fontSize: 12,
						lineHeight: 1.5,
						color: tokens.textSecondary,
						wordBreak: "break-all",
					}}
				>
					{referralLink}
				</Text>
			</Section>
		</Layout>
	);
}

WaitlistEmail.PreviewProps = {
	name: "Pranav",
	position: 15,
	referralLink: "https://www.codebhaav.in/waitlist?ref=PRANA-7K3X",
} satisfies WaitlistEmailProps;

export default WaitlistEmail;
