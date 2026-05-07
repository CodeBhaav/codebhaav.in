import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { useState, useCallback } from "react";

export function UserStatsCard() {
	const { user, isLoaded } = useUser();
	const email = user?.primaryEmailAddress?.emailAddress;

	const position = useQuery(api.waitlist.getPosition, email ? { email } : "skip");
	const referrals = useQuery(api.waitlist.getReferrals, email ? { email } : "skip");

	if (!isLoaded) return null;

	if (!user) {
		return (
			<div
				style={{
					backgroundColor: "#111113",
					border: "1px solid #1F1F23",
					borderRadius: "8px",
					padding: "24px",
					textAlign: "center",
				}}
			>
				<p style={{ color: "#71717A", fontSize: "14px" }}>
					Sign in to see your stats and referral link.
				</p>
				<a
					href="/sign-in"
					style={{
						display: "inline-block",
						marginTop: "12px",
						backgroundColor: "#F59E0B",
						color: "#FFFFFF",
						padding: "8px 20px",
						borderRadius: "6px",
						fontSize: "13px",
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
		return (
			<div
				style={{
					backgroundColor: "#111113",
					border: "1px solid #1F1F23",
					borderRadius: "8px",
					padding: "24px",
					height: "88px",
					animation: "pulse 2s ease-in-out infinite",
				}}
			>
				<style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
			</div>
		);
	}

	if (position === null || referrals === null) {
		return (
			<div
				style={{
					backgroundColor: "#111113",
					border: "1px solid #1F1F23",
					borderRadius: "8px",
					padding: "24px",
					textAlign: "center",
				}}
			>
				<p style={{ color: "#71717A", fontSize: "14px" }}>
					You're not on the waitlist yet.
				</p>
				<a
					href="/waitlist"
					style={{
						display: "inline-block",
						marginTop: "12px",
						backgroundColor: "#F59E0B",
						color: "#FFFFFF",
						padding: "8px 20px",
						borderRadius: "6px",
						fontSize: "13px",
						fontWeight: 500,
						textDecoration: "none",
					}}
				>
					Join the Waitlist
				</a>
			</div>
		);
	}

	const referralLink = `${window.location.origin}/waitlist?ref=${referrals.referralCode}`;

	return (
		<div>
			<StatsRow position={position.position} referrals={referrals} referralLink={referralLink} />
			<p style={{ fontSize: "12px", color: "#52525B", marginTop: "8px" }}>
				Share your link to climb the ranks
			</p>
		</div>
	);
}

function StatsRow({
	position,
	referrals,
	referralLink,
}: {
	position: number;
	referrals: { referralCount: number; referralCode: string };
	referralLink: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(referralLink).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	}, [referralLink]);

	return (
		<div
			style={{
				backgroundColor: "#111113",
				border: "1px solid #1F1F23",
				borderRadius: "8px",
				padding: "24px",
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "24px",
			}}
		>
			<Stat label="Position" value={`#${position}`} />
			<Divider />
			<Stat label="Referrals" value={String(referrals.referralCount)} />
			<Divider />
			<div>
				<p style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
					Code
				</p>
				<div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
					<span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 600, color: "#FAFAFA" }}>
						{referrals.referralCode}
					</span>
					<button
						type="button"
						onClick={handleCopy}
						style={{
							background: "none",
							border: "1px solid #1F1F23",
							borderRadius: "4px",
							color: copied ? "#22C55E" : "#71717A",
							fontSize: "11px",
							padding: "2px 8px",
							cursor: "pointer",
						}}
					>
						{copied ? "Copied!" : "Copy"}
					</button>
				</div>
			</div>
			<div style={{ marginLeft: "auto" }}>
				<button
					type="button"
					onClick={handleCopy}
					style={{
						backgroundColor: "#F59E0B",
						color: "#FFFFFF",
						borderRadius: "6px",
						padding: "8px 16px",
						fontSize: "13px",
						fontWeight: 500,
						border: "none",
						cursor: "pointer",
					}}
				>
					Share Link
				</button>
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p style={{ fontFamily: "monospace", fontSize: "11px", color: "#52525B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
				{label}
			</p>
			<p style={{ fontSize: "24px", fontWeight: 700, color: "#FAFAFA", marginTop: "4px" }}>
				{value}
			</p>
		</div>
	);
}

function Divider() {
	return (
		<div style={{ width: "1px", height: "40px", backgroundColor: "#1F1F23" }} />
	);
}
