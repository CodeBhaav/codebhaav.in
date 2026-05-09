import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { useState, useCallback } from "react";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

export function Dashboard() {
	const { user, isLoaded } = useUser();
	const email = user?.primaryEmailAddress?.emailAddress;
	const clerkUserId = user?.id;

	const position = useQuery(
		api.waitlist.getPosition,
		email ? { email } : "skip",
	);
	const referrals = useQuery(
		api.waitlist.getReferrals,
		email ? { email } : "skip",
	);
	const application = useQuery(
		api.foundingMember.getMyApplication,
		clerkUserId ? {} : "skip",
	);

	if (!isLoaded) {
		return <LoadingState />;
	}

	if (!user) {
		return (
			<div className="py-12 text-center">
				<p className="text-base text-text-secondary">
					Please sign in to view your dashboard.
				</p>
				<a
					href="/sign-in"
					className="mt-4 inline-flex h-10 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B]"
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
			<div className="py-12 text-center">
				<p className="text-lg font-semibold text-text-primary">
					You're not on the waitlist yet
				</p>
				<p className="mt-2 text-[15px] text-text-secondary">
					Join the waitlist to get your position and referral code.
				</p>
				<a
					href="/waitlist"
					className="mt-6 inline-flex h-10 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B]"
				>
					Join the Waitlist
				</a>
			</div>
		);
	}

	const referralLink = `${window.location.origin}/waitlist?ref=${referrals?.referralCode ?? ""}`;

	return (
		<div>
			<div className="mb-8 flex items-center justify-between gap-4">
				<p className="min-w-0 truncate text-sm text-text-secondary sm:text-[15px]">
					Welcome back, {user.firstName ?? email}
				</p>
				<UserButton afterSignOutUrl="/" />
			</div>

			<div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
				<StatCard label="Position" value={`#${position.position}`} />
				<StatCard
					label="Referrals"
					value={String(referrals?.referralCount ?? 0)}
				/>
				<StatCard label="Code" value={referrals?.referralCode ?? "·"} mono />
			</div>

			<ReferralCard link={referralLink} />

			{application && (
				<div className="mt-6">
					<ApplicationStatusCard
						status={application.status as ApplicationStatus}
					/>
				</div>
			)}

			<div className="mt-6 flex flex-wrap gap-3">
				<QuickLink href="/leaderboard" label="View Leaderboard" />
				{!application && (
					<QuickLink
						href="/founding-member"
						label="Apply as Founding Member"
					/>
				)}
				{application && (
					<QuickLink
						href="/founding-member"
						label="View Application"
					/>
				)}
				<QuickLink href="/dashboard/settings" label="Notification Settings" />
			</div>
		</div>
	);
}

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

const STATUS_BADGE: Record<
	ApplicationStatus,
	{ label: string; description: string; tone: "neutral" | "positive" | "negative" }
> = {
	submitted: {
		label: "Submitted",
		description: "Application received. We'll review within 7 days.",
		tone: "neutral",
	},
	in_review: {
		label: "In review",
		description: "Your application is being reviewed by the team.",
		tone: "neutral",
	},
	accepted: {
		label: "Accepted",
		description: "You're in. Watch your inbox for next steps.",
		tone: "positive",
	},
	rejected: {
		label: "Not selected",
		description:
			"You're still on the waitlist and the platform opens to everyone soon.",
		tone: "negative",
	},
};

function ApplicationStatusCard({ status }: { status: ApplicationStatus }) {
	const config = STATUS_BADGE[status];
	const toneClasses = {
		neutral: "border-[#1F1F23] bg-[#111113] text-[#a1a1aa]",
		positive: "border-[#f59e0b] bg-[#241906] text-[#fbbf24]",
		negative: "border-[#3a1a1a] bg-[#1a0a0a] text-[#f87171]",
	}[config.tone];

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<div className="flex items-center justify-between gap-3">
				<p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
					Founding Member Application
				</p>
				<span
					className={cn(
						"inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
						toneClasses,
					)}
				>
					{config.label}
				</span>
			</div>
			<p className="mt-3 text-sm text-text-secondary">{config.description}</p>
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
		<div className="rounded-card border border-border bg-card p-5">
			<p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
				{label}
			</p>
			<p
				className={cn(
					"mt-2 text-2xl font-bold text-text-primary sm:text-[28px]",
					mono && "font-mono",
				)}
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
			posthog.capture("referral_link_copied", { source: "dashboard" });
		});
	}, [link]);

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<p className="text-sm font-medium text-text-primary">
				Your referral link
			</p>
			<div className="mt-3 flex items-center gap-2 rounded-button border border-border bg-background px-3 py-2">
				<code className="flex-1 truncate font-mono text-[13px] text-accent">
					{link}
				</code>
				<button
					type="button"
					onClick={handleCopy}
					className={cn(
						"shrink-0 rounded-[4px] border border-border px-2.5 py-1 text-xs transition-colors hover:border-border-hover",
						copied ? "text-success" : "text-text-secondary",
					)}
				>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<p className="mt-3 text-xs text-text-muted">
				Share this link. When friends join, you move up the list.
			</p>
		</div>
	);
}

function QuickLink({ href, label }: { href: string; label: string }) {
	return (
		<a
			href={href}
			className="inline-flex h-9 items-center rounded-button border border-border px-4 text-[13px] text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
		>
			{label} &rarr;
		</a>
	);
}

function LoadingState() {
	return (
		<div className="py-12">
			<div className="mb-6 h-5 w-48 animate-pulse rounded-[4px] bg-border" />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-24 animate-pulse rounded-card border border-border bg-card"
					/>
				))}
			</div>
		</div>
	);
}
