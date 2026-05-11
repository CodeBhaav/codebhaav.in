import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import { CommentThread } from "./CommentThread";
import { InterestButton } from "./InterestButton";
import { StatusPill } from "./ProjectsListPanel";

interface Props {
	slug: string;
}

export function ProjectDetailPanel({ slug }: Props) {
	const project = useQuery(api.projects.getProjectBySlug, { slug });
	const toggleInterest = useMutation(api.projects.toggleInterest);
	const postComment = useMutation(api.projects.commentOnProject);
	const deleteComment = useMutation(api.projects.deleteMyProjectComment);

	if (project === undefined) return <LoadingState />;
	if (project === null) return <NotFound />;

	return (
		<div className="space-y-6">
			<a
				href="/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>

			<article className="rounded-card border border-border bg-card p-6">
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
					<span className="font-mono text-[11px] text-text-muted">
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
				<p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
					{project.description}
				</p>
				{project.techStack.length > 0 && (
					<div className="mt-5">
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Tech stack
						</p>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{project.techStack.map((tech) => (
								<span
									key={tech}
									className="inline-flex items-center rounded-[4px] border border-border bg-surface/60 px-2 py-1 font-mono text-[11px] text-text-secondary"
								>
									{tech}
								</span>
							))}
						</div>
					</div>
				)}

				{project.status !== "shipped" && (
					<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
						<p className="text-xs text-text-muted">
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
			</article>

			{project.team.length > 0 && (
				<section className="rounded-card border border-border bg-card p-6">
					<header>
						<h2 className="text-base font-semibold tracking-tight text-text-primary">
							Build team
						</h2>
						<p className="mt-0.5 text-xs text-text-muted">
							The members shipping this together.
						</p>
					</header>
					<ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{project.team.map((member) => (
							<li
								key={member.clerkUserId}
								className="flex items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5"
							>
								<Avatar name={member.userName} size={32} />
								<div className="min-w-0">
									<p className="truncate text-sm font-medium text-text-primary">
										{member.userName}
									</p>
									<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
										{member.role}
									</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}

			<section className="rounded-card border border-border bg-card p-6">
				<CommentThread
					comments={project.comments}
					placeholder="Shape this project  features, scope, concerns, suggestions."
					onPost={async (body) => {
						await postComment({
							projectId: project.id as Id<"project">,
							body,
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
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-72 animate-pulse rounded-card bg-surface" />
			<div className="h-40 animate-pulse rounded-card bg-surface" />
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
