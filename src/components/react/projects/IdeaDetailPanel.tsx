import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { ArrowLeft, Rocket } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import { CommentThread } from "./CommentThread";
import { VoteButton } from "./VoteButton";

interface Props {
	ideaId: string;
}

const COMMENTS_PAGE_SIZE = 50;

export function IdeaDetailPanel({ ideaId }: Props) {
	const idea = useQuery(api.projectIdeas.getIdea, {
		id: ideaId as Id<"projectIdea">,
	});
	const commentsQuery = usePaginatedQuery(
		api.projectIdeas.listIdeaComments,
		{ ideaId: ideaId as Id<"projectIdea"> },
		{ initialNumItems: COMMENTS_PAGE_SIZE },
	);
	const voteOnIdea = useMutation(api.projectIdeas.voteOnIdea);
	const postComment = useMutation(api.projectIdeas.commentOnIdea);
	const deleteComment = useMutation(api.projectIdeas.deleteMyComment);

	if (idea === undefined) return <LoadingState />;
	if (idea === null) return <NotFound />;

	return (
		<div className="space-y-6">
			<a
				href="/ideas"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to ideas
			</a>

			<article className="flex items-start gap-5 rounded-card border border-border bg-card p-6">
				<VoteButton
					upvotes={idea.upvoteCount}
					downvotes={idea.downvoteCount}
					myVote={idea.myVote}
					onVote={async (direction) => {
						await voteOnIdea({
							ideaId: idea.id as Id<"projectIdea">,
							direction,
						});
					}}
					size="lg"
					disabled={idea.status !== "open"}
				/>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<StatusPill status={idea.status} />
						{idea.status === "promoted" && idea.promotedToProjectId && (
							<a
								href={`/projects`}
								className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:underline"
							>
								<Rocket className="size-3" aria-hidden />
								Now a project
							</a>
						)}
					</div>
					<h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
						{idea.title}
					</h1>
					<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
						<span className="inline-flex items-center gap-1.5">
							<Avatar name={idea.submitterName} size={20} />
							{idea.submitterName}
						</span>
						<span className="font-mono">
							{formatRelative(idea.submittedAt)}
						</span>
					</div>
					<p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-text-secondary">
						{idea.description}
					</p>
					{idea.status === "rejected" && idea.rejectedReason && (
						<div className="mt-5 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
							<p className="font-mono text-[10px] uppercase tracking-widest text-rose-300/80">
								Admin note
							</p>
							<p className="mt-1">{idea.rejectedReason}</p>
						</div>
					)}
				</div>
			</article>

			<section className="rounded-card border border-border bg-card p-6">
				<CommentThread
					comments={commentsQuery.results}
					totalCount={idea.commentCount}
					loadStatus={commentsQuery.status}
					onLoadMore={() => commentsQuery.loadMore(COMMENTS_PAGE_SIZE)}
					onPost={async ({ body, parentId, mentions }) => {
						await postComment({
							ideaId: idea.id as Id<"projectIdea">,
							body,
							...(parentId
								? { parentId: parentId as Id<"ideaComment"> }
								: {}),
							...(mentions.length > 0 ? { mentions } : {}),
						});
					}}
					onDelete={async (commentId) => {
						await deleteComment({
							commentId: commentId as Id<"ideaComment">,
						});
					}}
				/>
			</section>
		</div>
	);
}

function StatusPill({
	status,
}: {
	status: "open" | "promoted" | "rejected";
}) {
	const cfg = {
		open: {
			label: "Open",
			classes: "border-border bg-surface text-text-secondary",
			dot: "#71717a",
		},
		promoted: {
			label: "Promoted to project",
			classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
			dot: "#10b981",
		},
		rejected: {
			label: "Not picked",
			classes: "border-rose-500/40 bg-rose-500/10 text-rose-300",
			dot: "#f43f5e",
		},
	}[status];
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cfg.classes}`}
		>
			<span
				className="size-1.5 rounded-full"
				style={{ background: cfg.dot }}
				aria-hidden
			/>
			{cfg.label}
		</span>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-48 animate-pulse rounded-card bg-surface" />
			<div className="h-40 animate-pulse rounded-card bg-surface" />
		</div>
	);
}

function NotFound() {
	return (
		<div className="space-y-6">
			<a
				href="/ideas"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to ideas
			</a>
			<div className="rounded-card border border-border bg-card p-6">
				<p className="text-sm font-medium text-text-primary">
					Idea not found.
				</p>
				<p className="mt-1 text-xs text-text-muted">
					It may have been removed or the URL is incorrect.
				</p>
			</div>
		</div>
	);
}
