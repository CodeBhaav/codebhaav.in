import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight, HandHelping, MessageSquare } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import {
	EmptyState,
	PageHeader,
	Panel,
	PanelHeader,
	formatRelative,
} from "./AdminOverview";
import { StatusPill } from "../projects/ProjectsListPanel";

export function AdminProjectsPanel() {
	const { user } = useUser();
	const projects = useQuery(
		api.projects.listProjectsForAdmin,
		user ? {} : "skip",
	);

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow="Admin"
				title="Projects"
				subtitle="Promoted projects, sorted by status. Click into one to manage the build team and flip status."
			/>

			<Panel padded={false}>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
					<PanelHeader
						title="All projects"
						subtitle={`${projects?.length ?? 0} ${(projects?.length ?? 0) === 1 ? "project" : "projects"}`}
						inline
					/>
					<a
						href="/admin/ideas"
						className="inline-flex h-9 items-center gap-1.5 rounded-button border border-border bg-card px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						<ChevronRight className="size-3.5" aria-hidden />
						Pick from ideas
					</a>
				</div>

				{projects === undefined ? (
					<div className="px-6 py-12">
						<div className="h-32 animate-pulse rounded-card bg-surface" />
					</div>
				) : projects.length === 0 ? (
					<div className="px-6 py-12">
						<EmptyState message="No projects yet. Promote a top idea from the Ideas page to create the first one." />
					</div>
				) : (
					<>
						{projects.some((p) => p.status === "open") && (
							<p className="border-b border-border bg-surface/30 px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
								Volunteer counts decide the monthly pick  highest at the top of each bucket.
							</p>
						)}
						<ul className="divide-y divide-border">
							{projects.map((p) => (
								<li key={p.id}>
									<a
										href={`/admin/projects/${p.slug}`}
										className="group flex items-center gap-5 px-6 py-4 transition-colors hover:bg-surface/40"
									>
										<VolunteerHero
											count={p.interestCount}
											status={p.status}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<StatusPill status={p.status} />
												<span className="font-mono text-[11px] text-text-muted">
													{p.status === "shipped" && p.shippedAt
														? `Shipped ${formatRelative(p.shippedAt)}`
														: p.status === "building" && p.buildStartedAt
															? `Building since ${formatRelative(p.buildStartedAt)}`
															: `Opened ${formatRelative(p.createdAt)}`}
												</span>
											</div>
											<p className="mt-2 truncate text-base font-semibold text-text-primary transition-colors group-hover:text-accent">
												{p.title}
											</p>
											<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
												{p.originatorName && (
													<span className="font-mono">
														Idea by {p.originatorName}
													</span>
												)}
												<span className="inline-flex items-center gap-1 font-mono">
													<MessageSquare className="size-3" aria-hidden />
													{p.commentCount}{" "}
													{p.commentCount === 1 ? "comment" : "comments"}
												</span>
											</div>
										</div>
										<ChevronRight
											className="size-4 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-text-primary"
											aria-hidden
										/>
									</a>
								</li>
							))}
						</ul>
					</>
				)}
			</Panel>
		</div>
	);
}

function VolunteerHero({
	count,
	status,
}: {
	count: number;
	status: "open" | "building" | "shipped";
}) {
	// Only show the loud signal for open projects  building/shipped have
	// less actionable volunteer counts (decisions already made).
	const muted = status !== "open";
	return (
		<div
			className={cn(
				"flex w-20 shrink-0 flex-col items-center justify-center rounded-card border py-3",
				muted
					? "border-border bg-card text-text-muted"
					: count >= 10
						? "border-amber-500/50 bg-amber-500/10 text-amber-300"
						: count >= 5
							? "border-accent/30 bg-accent/5 text-accent"
							: count > 0
								? "border-border bg-card text-text-primary"
								: "border-dashed border-border bg-card text-text-muted",
			)}
			title={`${count} ${count === 1 ? "volunteer" : "volunteers"}`}
		>
			<span className="flex items-baseline gap-1">
				<HandHelping className="size-3 opacity-70" aria-hidden />
				<span className="font-mono text-xl font-semibold tabular-nums leading-none">
					{count}
				</span>
			</span>
			<span className="mt-1 font-mono text-[9px] uppercase tracking-widest opacity-80">
				{count === 1 ? "volunteer" : "volunteers"}
			</span>
		</div>
	);
}
