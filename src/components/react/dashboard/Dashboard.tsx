import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { useState, useCallback } from "react";

export function Dashboard() {
	const { user, isLoaded } = useUser();
	const email = user?.primaryEmailAddress?.emailAddress;

	const position = useQuery(
		api.waitlist.getPosition,
		email ? { email } : "skip",
	);
	const referrals = useQuery(
		api.waitlist.getReferrals,
		email ? { email } : "skip",
	);

	if (!isLoaded) {
		return <LoadingState />;
	}

	if (!user) {
		return (
			<div style={{ textAlign: "center", padding: "48px 0" }}>
				<p style={{ color: "#71717A", fontSize: "16px" }}>
					Please sign in to view your dashboard.
				</p>
				<a
					href="/sign-in"
					style={{
						display: "inline-block",
						marginTop: "16px",
						backgroundColor: "#F59E0B",
						color: "#FFFFFF",
						padding: "10px 24px",
						borderRadius: "6px",
						fontSize: "14px",
						fontWeight: 500,
						textDecoration: "none",
					}}
				>
					Sign In
				</a>
			</div>
		);
	}

	if (position === undefined || referrals === undefined) {
		return <LoadingState />;
	}

	if (position === null) {
		return (
			<div style={{ textAlign: "center", padding: "48px 0" }}>
				<p
					style={{
						fontSize: "20px",
						fontWeight: 600,
						color: "#FAFAFA",
						marginBottom: "8px",
					}}
				>
					You're not on the waitlist yet
				</p>
				<p
					style={{
						color: "#71717A",
						fontSize: "15px",
						marginBottom: "24px",
					}}
				>
					Join the waitlist to get your position and referral code.
				</p>
				<a
					href="/waitlist"
					style={{
						display: "inline-block",
						backgroundColor: "#F59E0B",
						color: "#FFFFFF",
						padding: "10px 24px",
						borderRadius: "6px",
						fontSize: "14px",
						fontWeight: 500,
						textDecoration: "none",
					}}
				>
					Join the Waitlist
				</a>
			</div>
		);
	}

	const referralLink = `${window.location.origin}/waitlist?ref=${referrals?.referralCode ?? ""}`;

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "16px",
					marginBottom: "32px",
				}}
			>
				<p style={{ color: "#71717A", fontSize: "15px" }}>
					Welcome back, {user.firstName ?? email}
				</p>
				<UserButton
					afterSignOutUrl="/"
					appearance={{ elements: { avatarBox: "width: 36, height: 36" } }}
				/>
			</div>

			{/* Stats Grid */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					gap: "16px",
					marginBottom: "32px",
				}}
			>
				<StatCard label="Position" value={`#${position.position}`} />
				<StatCard
					label="Referrals"
					value={String(referrals?.referralCount ?? 0)}
				/>
				<StatCard label="Code" value={referrals?.referralCode ?? "·"} mono />
			</div>

			{/* Referral Link */}
			<ReferralCard link={referralLink} />

			{/* Quick Links */}
			<div
				style={{
					display: "flex",
					gap: "12px",
					marginTop: "24px",
					flexWrap: "wrap",
				}}
			>
				<QuickLink href="/leaderboard" label="View Leaderboard" />
				<QuickLink href="/founding-member" label="Apply as Founding Member" />
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div
			style={{
				backgroundColor: "#111113",
				border: "1px solid #1F1F23",
				borderRadius: "8px",
				padding: "20px",
			}}
		>
			<p
				style={{
					fontFamily: "monospace",
					fontSize: "11px",
					color: "#52525B",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					marginBottom: "8px",
				}}
			>
				{label}
			</p>
			<p
				style={{
					fontSize: "28px",
					fontWeight: 700,
					color: "#FAFAFA",
					fontFamily: mono ? "monospace" : "inherit",
				}}
			>
				{value}
			</p>
		</div>
	);
}

function ReferralCard({ link }: { link: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(link).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [link]);

	return (
		<div
			style={{
				backgroundColor: "#111113",
				border: "1px solid #1F1F23",
				borderRadius: "8px",
				padding: "20px",
			}}
		>
			<p
				style={{
					color: "#FAFAFA",
					fontSize: "14px",
					fontWeight: 500,
					marginBottom: "12px",
				}}
			>
				Your referral link
			</p>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					backgroundColor: "#0A0A0C",
					border: "1px solid #1F1F23",
					borderRadius: "6px",
					padding: "10px 12px",
				}}
			>
				<code
					style={{
						fontFamily: "monospace",
						fontSize: "13px",
						color: "#F59E0B",
						flex: 1,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{link}
				</code>
				<button
					type="button"
					onClick={handleCopy}
					style={{
						background: "none",
						border: "1px solid #1F1F23",
						borderRadius: "4px",
						color: copied ? "#22C55E" : "#71717A",
						fontSize: "12px",
						padding: "4px 10px",
						cursor: "pointer",
						flexShrink: 0,
					}}
				>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<p
				style={{
					color: "#52525B",
					fontSize: "12px",
					marginTop: "8px",
				}}
			>
				Share this link. When friends join, you move up the list.
			</p>
		</div>
	);
}

function QuickLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			style={{
				display: "inline-block",
				border: "1px solid #1F1F23",
				borderRadius: "6px",
				padding: "8px 16px",
				color: "#71717A",
				fontSize: "13px",
				textDecoration: "none",
			}}
		>
			{label} &rarr;
		</a>
	);
}

function LoadingState() {
	return (
		<div style={{ padding: "48px 0" }}>
			<div
				style={{
					height: "20px",
					width: "200px",
					backgroundColor: "#1F1F23",
					borderRadius: "4px",
					marginBottom: "24px",
					animation: "pulse 2s ease-in-out infinite",
				}}
			/>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "16px",
				}}
			>
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						style={{
							height: "100px",
							backgroundColor: "#111113",
							borderRadius: "8px",
							border: "1px solid #1F1F23",
							animation: "pulse 2s ease-in-out infinite",
						}}
					/>
				))}
			</div>
			<style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
		</div>
	);
}
