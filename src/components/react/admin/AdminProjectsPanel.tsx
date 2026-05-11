import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { ChevronRight, HandHelping, MessageSquare } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
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
					<ul className="divide-y divide-border">
						{projects.map((p) => (
							<li key={p.id}>
								<a
									href={`/admin/projects/${p.slug}`}
									className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface/40"
								>
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
												<HandHelping className="size-3" aria-hidden />
												{p.interestCount}{" "}
												{p.interestCount === 1 ? "volunteer" : "volunteers"}
											</span>
											<span className="inline-flex items-center gap-1 font-mono">
												<MessageSquare className="size-3" aria-hidden />
												{p.commentCount}
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
				)}
			</Panel>
		</div>
	);
}
