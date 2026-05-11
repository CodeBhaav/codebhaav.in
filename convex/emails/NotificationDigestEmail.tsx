import { Button, Heading, Link, Text } from "@react-email/components";
import * as React from "react";
import { eyebrowStyle, fonts, Layout, tokens } from "./Layout";

interface DigestItem {
	title: string;
	body: string;
	targetUrl: string;
}

interface NotificationDigestEmailProps {
	name: string;
	items: DigestItem[];
	settingsUrl: string;
	siteUrl: string;
}

export function NotificationDigestEmail({
	name,
	items,
	settingsUrl,
	siteUrl,
}: NotificationDigestEmailProps) {
	const count = items.length;
	return (
		<Layout
			preview={`${count} new ${count === 1 ? "update" : "updates"} on CodeBhaav`}
		>
			<Text
				style={{ ...eyebrowStyle, color: tokens.textMuted, marginBottom: 14 }}
			>
				Activity · Daily digest
			</Text>
			<Heading
				as="h1"
				style={{
					margin: "0 0 12px 0",
					fontSize: 26,
					lineHeight: 1.2,
					fontWeight: 700,
					letterSpacing: "-0.015em",
					color: tokens.text,
				}}
			>
				{count === 1
					? `1 update for you, ${name}`
					: `${count} updates for you, ${name}`}
			</Heading>
			<Text
				style={{
					margin: "0 0 24px 0",
					fontSize: 14,
					lineHeight: 1.6,
					color: tokens.textSecondary,
				}}
			>
				Here's what happened on CodeBhaav since you last checked in.
			</Text>

			<table
				cellPadding={0}
				cellSpacing={0}
				border={0}
				role="presentation"
				style={{ width: "100%", borderCollapse: "collapse" }}
			>
				<tbody>
					{items.map((it, i) => {
						const fullUrl = it.targetUrl.startsWith("http")
							? it.targetUrl
							: `${siteUrl}${it.targetUrl}`;
						return (
							<tr key={i}>
								<td
									style={{
										padding: "14px 0",
										borderTop:
											i === 0 ? "none" : `1px solid ${tokens.border}`,
									}}
								>
									<Text
										style={{
											margin: 0,
											fontSize: 14,
											fontWeight: 600,
											color: tokens.text,
											lineHeight: 1.4,
										}}
									>
										{it.title}
									</Text>
									<Text
										style={{
											margin: "6px 0 8px 0",
											fontSize: 13,
											lineHeight: 1.55,
											color: tokens.textSecondary,
										}}
									>
										{it.body}
									</Text>
									<Link
										href={fullUrl}
										style={{
											fontFamily: fonts.mono,
											fontSize: 11,
											letterSpacing: "0.06em",
											color: tokens.amber,
											textDecoration: "none",
										}}
									>
										Open →
									</Link>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			<div style={{ marginTop: 28 }}>
				<Button
					href={`${siteUrl}/dashboard/notifications`}
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
					Open inbox →
				</Button>
			</div>

			<Text
				style={{
					margin: "28px 0 0 0",
					fontFamily: fonts.mono,
					fontSize: 11,
					letterSpacing: "0.05em",
					color: tokens.textMuted,
					lineHeight: 1.6,
				}}
			>
				Don't want these? Turn off "Activity Updates" in your{" "}
				<Link
					href={settingsUrl}
					style={{ color: tokens.amber, textDecoration: "none" }}
				>
					notification settings
				</Link>
				.
			</Text>
		</Layout>
	);
}

NotificationDigestEmail.PreviewProps = {
	name: "Pranav",
	items: [
		{
			title: "Aarav replied to your comment",
			body: "Hey, I'd love to help with the Convex side  let's pair this week.",
			targetUrl: "/projects/codebhaav-platform",
		},
		{
			title: "Your idea was promoted to a project",
			body: '"Mentorship-matching algorithm" is now live at /projects/mentorship-matching-algorithm.',
			targetUrl: "/projects/mentorship-matching-algorithm",
		},
	],
	settingsUrl: "https://www.codebhaav.in/dashboard/settings",
	siteUrl: "https://www.codebhaav.in",
} satisfies NotificationDigestEmailProps;

export default NotificationDigestEmail;
