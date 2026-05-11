import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ArrowLeft, Calendar, Lightbulb } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatRelative } from "../admin/AdminOverview";
import { BuildTeamCard } from "./BuildTeamCard";
import { CommentThread } from "./CommentThread";
import { InterestButton } from "./InterestButton";
import { StatusPill } from "./ProjectsListPanel";
import { TechStackCard } from "./TechStackCard";

interface Props {
	slug: string;
}

const COMMENTS_PAGE_SIZE = 50;

export function ProjectDetailPanel({ slug }: Props) {
	const project = useQuery(api.projects.getProjectBySlug, { slug });
	const commentsQuery = usePaginatedQuery(
		api.projects.listProjectComments,
		project ? { projectId: project.id as Id<"project"> } : "skip",
		{ initialNumItems: COMMENTS_PAGE_SIZE },
	);
	const toggleInterest = useMutation(api.projects.toggleInterest);
	const postComment = useMutation(api.projects.commentOnProject);
	const deleteComment = useMutation(api.projects.deleteMyProjectComment);

	if (project === undefined) return <LoadingState />;
	if (project === null) return <NotFound />;

	const canManage = project.youAreAdmin || project.youAreTeamLead;

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
				<div className="flex flex-wrap items-center gap-3">
					<StatusPill status={project.status} size="md" />
					{project.originatorName && (
						<span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
							<Lightbulb className="size-3" aria-hidden />
							Idea by{" "}
							<span className="text-text-secondary">
								{project.originatorName}
							</span>
						</span>
					)}
					<span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-muted">
						<Calendar className="size-3" aria-hidden />
						{project.status === "shipped" && project.shippedAt
							? `Shipped ${formatRelative(project.shippedAt)}`
							: project.status === "building" && project.buildStartedAt
								? `Building since ${formatRelative(project.buildStartedAt)}`
								: `Opened ${formatRelative(project.createdAt)}`}
					</span>
				</div>
				<h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
					{project.title}
				</h1>

				{project.status !== "shipped" && (
					<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
						<p className="text-xs text-text-muted max-w-md">
							{project.status === "building"
								? "This project is currently being built  the team is set."
								: "Want to help build this when it's picked? Tap the button to volunteer."}
						</p>
						<InterestButton
							interested={project.youInterested}
							count={project.interestCount}
							onToggle={async () => {
								await toggleInterest({
									projectId: project.id as Id<"project">,
								});
							}}
							disabled={project.status === "building"}
						/>
					</div>
				)}
			</header>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
				{/* Main column: description + discussion */}
				<div className="space-y-4 lg:col-span-2 min-w-0">
					<section className="rounded-card border border-border bg-card p-6">
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							About
						</p>
						<p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
							{project.description}
						</p>
					</section>

					<section className="rounded-card border border-border bg-card p-6">
						<CommentThread
							comments={commentsQuery.results}
							totalCount={project.commentCount}
							loadStatus={commentsQuery.status}
							onLoadMore={() => commentsQuery.loadMore(COMMENTS_PAGE_SIZE)}
							placeholder="Shape this project  features, scope, concerns, suggestions. Type @ to mention someone."
							onPost={async ({ body, parentId, mentions }) => {
								await postComment({
									projectId: project.id as Id<"project">,
									body,
									...(parentId
										? { parentId: parentId as Id<"projectComment"> }
										: {}),
									...(mentions.length > 0 ? { mentions } : {}),
								});
							}}
							onDelete={async (commentId) => {
								await deleteComment({
									commentId: commentId as Id<"projectComment">,
								});
							}}
						/>
					</section>
				</div>

				{/* Sidebar: tech stack + team + status info */}
				<aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
					<TechStackCard
						projectId={project.id}
						techStack={project.techStack}
						canEdit={canManage}
					/>
					<BuildTeamCard
						projectId={project.id}
						team={project.team}
						volunteers={project.volunteers}
						teamLeadClerkUserId={project.teamLeadClerkUserId}
						canManage={canManage}
						isAdmin={project.youAreAdmin}
					/>
				</aside>
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-40 animate-pulse rounded-card bg-surface" />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
				<div className="lg:col-span-2 space-y-4">
					<div className="h-48 animate-pulse rounded-card bg-surface" />
					<div className="h-64 animate-pulse rounded-card bg-surface" />
				</div>
				<div className="space-y-4">
					<div className="h-36 animate-pulse rounded-card bg-surface" />
					<div className="h-36 animate-pulse rounded-card bg-surface" />
				</div>
			</div>
		</div>
	);
}

function NotFound() {
	return (
		<div className="space-y-6">
			<a
				href="/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>
			<div className="rounded-card border border-border bg-card p-6">
				<p className="text-sm font-medium text-text-primary">
					Project not found.
				</p>
				<p className="mt-1 text-xs text-text-muted">
					It may have been removed or the URL is incorrect.
				</p>
			</div>
		</div>
	);
}
