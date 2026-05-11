import { useQuery } from "convex/react";
import {
	ArrowLeft,
	Crown,
	Lightbulb,
	MessageSquare,
	Sparkles,
	Users,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import { StatusPill } from "../projects/ProjectsListPanel";

interface Props {
	username: string;
}

export function ProfilePanel({ username }: Props) {
	const profile = useQuery(api.profiles.getProfileByUsername, { username });

	if (profile === undefined) return <LoadingState />;
	if (profile === null) return <NotFound username={username} />;

	const ideaCount = profile.ideas.length;
	const projectCount = profile.originatedProjects.length;
	const teamCount = profile.teamProjects.length;

	return (
		<div className="space-y-6">
			<a
				href="/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>

			<header className="rounded-card border border-border bg-card p-6">
				<div className="flex items-start gap-4">
					<Avatar name={profile.displayName} size={56} />
					<div className="min-w-0 flex-1">
						<h1 className="text-2xl font-bold tracking-tight text-text-primary">
							{profile.displayName}
						</h1>
						<p className="mt-1 font-mono text-xs text-text-muted">
							@{profile.username}
						</p>
						{profile.memberSince && (
							<p className="mt-3 font-mono text-[11px] text-text-muted">
								Active since{" "}
								<span className="text-text-secondary">
									{formatRelative(profile.memberSince)}
								</span>
							</p>
						)}
					</div>
					{profile.isOwner && (
						<span className="inline-flex items-center rounded-[4px] border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
							You
						</span>
					)}
				</div>

				<div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
					<Stat
						icon={<Lightbulb className="size-3.5" aria-hidden />}
						label="Ideas"
						value={ideaCount}
					/>
					<Stat
						icon={<Sparkles className="size-3.5" aria-hidden />}
						label="Originated"
						value={projectCount}
					/>
					<Stat
						icon={<Users className="size-3.5" aria-hidden />}
						label="Building"
						value={teamCount}
					/>
					<Stat
						icon={<MessageSquare className="size-3.5" aria-hidden />}
						label="Comments"
						value={profile.commentCount}
					/>
				</div>
			</header>

			<section className="rounded-card border border-border bg-card p-6">
				<header className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold tracking-tight text-text-primary">
						Building &amp; team work
					</h2>
					<span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						{teamCount} {teamCount === 1 ? "project" : "projects"}
					</span>
				</header>
				{teamCount === 0 ? (
					<p className="text-sm text-text-muted">
						Not on any build team yet.
					</p>
				) : (
					<ul className="space-y-2">
						{profile.teamProjects.map((p) => (
							<li
								key={p.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-border bg-background/40 px-3 py-2"
							>
								<div className="min-w-0">
									<a
										href={`/projects/${p.slug}`}
										className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
									>
										{p.title}
									</a>
									<p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
										{p.isTeamLead && (
											<span className="inline-flex items-center gap-0.5 text-amber-300">
												<Crown className="size-3" aria-hidden />
												Team lead
											</span>
										)}
										{p.isTeamLead && p.role !== "Team Lead" && (
											<span>·</span>
										)}
										{(!p.isTeamLead || p.role !== "Team Lead") && (
											<span>{p.role}</span>
										)}
									</p>
								</div>
								<StatusPill status={p.status} />
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-card border border-border bg-card p-6">
				<header className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold tracking-tight text-text-primary">
						Originated projects
					</h2>
					<span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						{projectCount} {projectCount === 1 ? "project" : "projects"}
					</span>
				</header>
				{projectCount === 0 ? (
					<p className="text-sm text-text-muted">
						No promoted ideas yet  keep submitting.
					</p>
				) : (
					<ul className="space-y-2">
						{profile.originatedProjects.map((p) => (
							<li
								key={p.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-border bg-background/40 px-3 py-2"
							>
								<div className="min-w-0">
									<a
										href={`/projects/${p.slug}`}
										className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
									>
										{p.title}
									</a>
									<p className="mt-0.5 font-mono text-[10px] text-text-muted">
										{p.interestCount}{" "}
										{p.interestCount === 1 ? "builder" : "builders"} interested
									</p>
								</div>
								<StatusPill status={p.status} />
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="rounded-card border border-border bg-card p-6">
				<header className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold tracking-tight text-text-primary">
						Submitted ideas
					</h2>
					<span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						{ideaCount} {ideaCount === 1 ? "idea" : "ideas"}
					</span>
				</header>
				{ideaCount === 0 ? (
					<p className="text-sm text-text-muted">No ideas submitted yet.</p>
				) : (
					<ul className="space-y-2">
						{profile.ideas.map((i) => (
							<li
								key={i.id}
								className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-border bg-background/40 px-3 py-2"
							>
								<div className="min-w-0 flex-1">
									<a
										href={`/ideas/${i.id}`}
										className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
									>
										{i.title}
									</a>
									<p className="mt-0.5 font-mono text-[10px] text-text-muted">
										{i.upvoteCount - i.downvoteCount} score ·{" "}
										{i.commentCount}{" "}
										{i.commentCount === 1 ? "comment" : "comments"} ·{" "}
										{formatRelative(i.submittedAt)}
									</p>
								</div>
								<IdeaStatusBadge status={i.status} />
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function Stat({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
				{icon}
				{label}
			</span>
			<span className="font-mono text-2xl font-semibold text-text-primary">
				{value}
			</span>
		</div>
	);
}

function IdeaStatusBadge({
	status,
}: {
	status: "open" | "promoted" | "rejected";
}) {
	const cfg = {
		open: {
			label: "Open",
			classes: "border-border bg-surface text-text-secondary",
		},
		promoted: {
			label: "Promoted",
			classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
		},
		rejected: {
			label: "Rejected",
			classes: "border-rose-500/40 bg-rose-500/10 text-rose-300",
		},
	}[status];
	return (
		<span
			className={`inline-flex items-center rounded-[4px] border ${cfg.classes} px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider`}
		>
			{cfg.label}
		</span>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-40 animate-pulse rounded-card bg-surface" />
			<div className="h-32 animate-pulse rounded-card bg-surface" />
			<div className="h-32 animate-pulse rounded-card bg-surface" />
		</div>
	);
}

function NotFound({ username }: { username: string }) {
	return (
		<div className="space-y-6">
			<a
				href="/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>
			<div className="rounded-card border border-border bg-card p-6 text-center">
				<p className="text-sm font-medium text-text-primary">
					No one with that username yet.
				</p>
				<p className="mt-1 text-xs text-text-muted">
					<span className="font-mono">@{username}</span> hasn't shown up in any
					comments, ideas, or projects.
				</p>
			</div>
		</div>
	);
}
