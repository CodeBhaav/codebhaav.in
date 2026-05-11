import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { MessageSquare, Plus } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import { VoteButton } from "./VoteButton";
import { IdeaSubmitForm } from "./IdeaSubmitForm";

type Sort = "top" | "new";

export function IdeasListPanel() {
	const { user, isLoaded } = useUser();
	const [sort, setSort] = useState<Sort>("top");
	const [composerOpen, setComposerOpen] = useState(false);
	const ideas = useQuery(api.projectIdeas.listIdeas, { sort, limit: 100 });
	const voteOnIdea = useMutation(api.projectIdeas.voteOnIdea);

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						Community ideas
					</p>
					<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
						Ideas
					</h1>
					<p className="mt-1.5 max-w-xl text-sm text-text-secondary">
						Anything anyone wants the community to build. Upvote the ones that
						excite you, leave comments to shape them. Top-voted ideas get
						promoted to real projects.
					</p>
				</div>
				{isLoaded &&
					(user ? (
						<button
							type="button"
							onClick={() => setComposerOpen((v) => !v)}
							className="inline-flex h-9 items-center gap-1.5 rounded-button bg-accent px-3.5 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
						>
							<Plus className="size-3.5" aria-hidden />
							{composerOpen ? "Close" : "Share an idea"}
						</button>
					) : (
						<a
							href="/sign-in"
							className="inline-flex h-9 items-center rounded-button border border-border bg-card px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
						>
							Sign in to share
						</a>
					))}
			</header>

			{composerOpen && (
				<IdeaSubmitForm
					onSuccess={() => {
						setComposerOpen(false);
					}}
				/>
			)}

			<div className="flex items-center gap-1 rounded-button border border-border bg-card p-1 w-fit">
				{(["top", "new"] as Sort[]).map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setSort(s)}
						className={cn(
							"rounded-[4px] px-3 py-1 text-xs font-medium transition-colors capitalize",
							sort === s
								? "bg-accent/10 text-accent"
								: "text-text-secondary hover:bg-surface hover:text-text-primary",
						)}
					>
						{s}
					</button>
				))}
			</div>

			{ideas === undefined ? (
				<LoadingState />
			) : ideas.length === 0 ? (
				<EmptyState onShare={() => setComposerOpen(true)} canShare={!!user} />
			) : (
				<ul className="space-y-3">
					{ideas.map((idea) => (
						<IdeaRow
							key={idea.id}
							idea={idea}
							onVote={async (direction) => {
								await voteOnIdea({
									ideaId: idea.id as Id<"projectIdea">,
									direction,
								});
							}}
						/>
					))}
				</ul>
			)}
		</div>
	);
}

interface IdeaSummary {
	id: string;
	title: string;
	description: string;
	submitterName: string;
	upvoteCount: number;
	downvoteCount: number;
	commentCount: number;
	submittedAt: number;
	myVote: "up" | "down" | null;
}

function IdeaRow({
	idea,
	onVote,
}: {
	idea: IdeaSummary;
	onVote: (direction: "up" | "down") => Promise<void>;
}) {
	const href = `/ideas/${idea.id}`;
	return (
		<li>
			<a
				href={href}
				className="group flex items-stretch gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-border-hover"
			>
				<VoteButton
					upvotes={idea.upvoteCount}
					downvotes={idea.downvoteCount}
					myVote={idea.myVote}
					onVote={onVote}
					size="lg"
				/>
				<div className="min-w-0 flex-1">
					<h3 className="text-base font-semibold text-text-primary leading-snug transition-colors group-hover:text-accent">
						{idea.title}
					</h3>
					<p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
						{idea.description}
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
						<span className="inline-flex items-center gap-1.5">
							<Avatar name={idea.submitterName} size={20} />
							{idea.submitterName}
						</span>
						<span className="font-mono">{formatRelative(idea.submittedAt)}</span>
						<span className="inline-flex items-center gap-1 font-mono">
							<MessageSquare className="size-3" aria-hidden />
							{idea.commentCount}
						</span>
					</div>
				</div>
			</a>
		</li>
	);
}

function LoadingState() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="h-28 animate-pulse rounded-card border border-border bg-card"
				/>
			))}
		</div>
	);
}

function EmptyState({
	onShare,
	canShare,
}: {
	onShare: () => void;
	canShare: boolean;
}) {
	return (
		<div className="rounded-card border border-dashed border-border bg-background/40 px-6 py-12 text-center">
			<p className="font-mono text-base text-text-muted" aria-hidden>

			</p>
			<p className="mt-2 text-sm text-text-secondary">
				No ideas yet. Be the first to share one.
			</p>
			{canShare && (
				<button
					type="button"
					onClick={onShare}
					className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-button bg-accent px-3.5 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
				>
					<Plus className="size-3.5" aria-hidden />
					Share the first idea
				</button>
			)}
		</div>
	);
}
