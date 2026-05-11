import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/clerk-react";
import { ChevronRight, Lightbulb, MessageSquare, Rocket } from "lucide-react";
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
	const myIdeas = useQuery(
		api.projectIdeas.listMyIdeas,
		clerkUserId ? {} : "skip",
	);
	const myInterested = useQuery(
		api.projects.listMyInterestedProjects,
		clerkUserId ? {} : "skip",
	);
	const myBuilding = useQuery(
		api.projects.listMyBuildingProjects,
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

			<MyIdeasCard ideas={myIdeas ?? []} />
			<MyProjectsCard
				building={myBuilding ?? []}
				interested={myInterested ?? []}
			/>

			<div className="mt-6 flex flex-wrap gap-3">
				<QuickLink href="/ideas" label="Browse Ideas" />
				<QuickLink href="/projects" label="Browse Projects" />
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
				<QuickLink href="/dashboard/notifications" label="Inbox" />
				<QuickLink href="/dashboard/settings" label="Notification Settings" />
			</div>
		</div>
	);
}

function MyIdeasCard({
	ideas,
}: {
	ideas: Array<{
		id: string;
		title: string;
		status: "open" | "promoted" | "rejected";
		upvoteCount: number;
		downvoteCount: number;
		commentCount: number;
		submittedAt: number;
		rejectedReason: string | null;
	}>;
}) {
	const empty = ideas.length === 0;
	const visible = ideas.slice(0, 4);
	const tone: Record<string, string> = {
		open: "border-border bg-surface text-text-secondary",
		promoted: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
		rejected: "border-rose-500/40 bg-rose-500/10 text-rose-300",
	};
	const label: Record<string, string> = {
		open: "Open",
		promoted: "Promoted",
		rejected: "Not picked",
	};
	return (
		<div className="mt-6 rounded-card border border-border bg-card p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
						Your ideas
					</p>
					<p className="mt-1 text-sm text-text-secondary">
						{empty
							? "Drop something the community might want to build."
							: `${ideas.length} idea${ideas.length === 1 ? "" : "s"} submitted`}
					</p>
				</div>
				<a
					href="/ideas"
					className="inline-flex h-8 items-center gap-1.5 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
				>
					<Lightbulb className="size-3.5" aria-hidden />
					{empty ? "Share an idea" : "View ideas"}
				</a>
			</div>
			{!empty && (
				<ul className="mt-4 space-y-2">
					{visible.map((idea) => (
						<li key={idea.id}>
							<a
								href={`/ideas/${idea.id}`}
								className="group flex items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5 transition-colors hover:border-border-hover"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
										{idea.title}
									</p>
									<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono text-text-muted">
										<span>
											{idea.upvoteCount - idea.downvoteCount} score
											<span className="ml-1 text-text-muted/70">
												({idea.upvoteCount}↑ {idea.downvoteCount}↓)
											</span>
										</span>
										<span className="inline-flex items-center gap-1">
											<MessageSquare className="size-3" aria-hidden />
											{idea.commentCount}
										</span>
									</div>
								</div>
								<span
									className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone[idea.status]}`}
								>
									{label[idea.status]}
								</span>
								<ChevronRight
									className="size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
									aria-hidden
								/>
							</a>
						</li>
					))}
				</ul>
			)}
			{ideas.length > 4 && (
				<a
					href="/ideas"
					className="mt-3 inline-block text-xs text-accent hover:text-accent-hover"
				>
					View all {ideas.length} →
				</a>
			)}
		</div>
	);
}

function MyProjectsCard({
	building,
	interested,
}: {
	building: Array<{
		id: string;
		slug: string;
		title: string;
		status: "open" | "building" | "shipped";
		role: string;
	}>;
	interested: Array<{
		id: string;
		slug: string;
		title: string;
		status: "open" | "building" | "shipped";
		interestCount: number;
		commentCount: number;
	}>;
}) {
	if (building.length === 0 && interested.length === 0) return null;
	return (
		<div className="mt-6 rounded-card border border-border bg-card p-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
						Your projects
					</p>
					<p className="mt-1 text-sm text-text-secondary">
						Where you're on the team or have volunteered to help.
					</p>
				</div>
				<a
					href="/projects"
					className="inline-flex h-8 items-center gap-1.5 rounded-button border border-border bg-background px-3 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
				>
					<Rocket className="size-3.5" aria-hidden />
					Browse projects
				</a>
			</div>

			{building.length > 0 && (
				<div className="mt-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Building ({building.length})
					</p>
					<ul className="mt-2 space-y-2">
						{building.map((p) => (
							<li key={p.id}>
								<a
									href={`/projects/${p.slug}`}
									className="group flex items-center gap-3 rounded-[6px] border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 transition-colors hover:border-amber-500/50"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
											{p.title}
										</p>
										<p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
											{p.role}
										</p>
									</div>
									<ChevronRight
										className="size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
										aria-hidden
									/>
								</a>
							</li>
						))}
					</ul>
				</div>
			)}

			{interested.length > 0 && (
				<div className="mt-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Volunteered ({interested.length})
					</p>
					<ul className="mt-2 space-y-2">
						{interested.slice(0, 4).map((p) => (
							<li key={p.id}>
								<a
									href={`/projects/${p.slug}`}
									className="group flex items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5 transition-colors hover:border-border-hover"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
											{p.title}
										</p>
										<div className="mt-0.5 flex items-center gap-3 text-[11px] font-mono text-text-muted">
											<span>{p.interestCount} volunteers</span>
											<span className="inline-flex items-center gap-1">
												<MessageSquare className="size-3" aria-hidden />
												{p.commentCount}
											</span>
										</div>
									</div>
									<ChevronRight
										className="size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5"
										aria-hidden
									/>
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
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
