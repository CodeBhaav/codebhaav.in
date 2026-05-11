import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { FunctionReference } from "convex/server";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, formatRelative } from "../admin/AdminOverview";

export interface CommentItem {
	id: string;
	authorName: string;
	body: string;
	createdAt: number;
	mine: boolean;
}

interface Props {
	comments: CommentItem[];
	onPost: (body: string) => Promise<void>;
	onDelete: (commentId: string) => Promise<void>;
	placeholder?: string;
	className?: string;
}

export function CommentThread({
	comments,
	onPost,
	onDelete,
	placeholder = "Add a comment, suggestion, or question",
	className,
}: Props) {
	const { user, isLoaded } = useUser();
	const [draft, setDraft] = useState("");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handlePost = async () => {
		const body = draft.trim();
		if (!body || posting) return;
		setPosting(true);
		setError(null);
		try {
			await onPost(body);
			setDraft("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to post");
		} finally {
			setPosting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this comment?")) return;
		setDeletingId(id);
		try {
			await onDelete(id);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to delete");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className={cn("space-y-5", className)}>
			<header className="flex items-baseline justify-between">
				<h3 className="text-base font-semibold tracking-tight text-text-primary">
					Discussion
				</h3>
				<span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
					{comments.length}{" "}
					{comments.length === 1 ? "comment" : "comments"}
				</span>
			</header>

			{isLoaded && !user ? (
				<div className="rounded-card border border-dashed border-border bg-background/40 px-4 py-5 text-center">
					<p className="text-sm text-text-secondary">
						<a
							href="/sign-in"
							className="text-accent hover:text-accent-hover"
						>
							Sign in
						</a>{" "}
						to leave a comment.
					</p>
				</div>
			) : (
				<div className="rounded-card border border-border bg-card">
					<textarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						placeholder={placeholder}
						rows={3}
						maxLength={2000}
						className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-muted outline-none min-h-[88px]"
					/>
					<div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
						<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							{draft.trim().length}/2000
						</span>
						<button
							type="button"
							disabled={posting || draft.trim().length === 0}
							onClick={handlePost}
							className="inline-flex h-8 items-center rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
						>
							{posting ? "Posting…" : "Post"}
						</button>
					</div>
				</div>
			)}

			{error && (
				<p className="text-xs text-rose-300" role="alert">
					{error}
				</p>
			)}

			<ul className="space-y-3">
				{comments.length === 0 ? (
					<li className="rounded-[6px] border border-dashed border-border bg-background/40 px-4 py-6 text-center text-sm text-text-muted">
						No comments yet. Be the first.
					</li>
				) : (
					comments.map((c) => (
						<li
							key={c.id}
							className="group rounded-[6px] border border-border bg-card px-4 py-3"
						>
							<div className="flex items-start gap-3">
								<Avatar name={c.authorName} size={28} />
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-baseline gap-2">
										<p className="text-sm font-medium text-text-primary">
											{c.authorName}
										</p>
										<span className="font-mono text-[10px] text-text-muted">
											{formatRelative(c.createdAt)}
										</span>
									</div>
									<p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
										{c.body}
									</p>
								</div>
								{c.mine && (
									<button
										type="button"
										disabled={deletingId === c.id}
										onClick={() => handleDelete(c.id)}
										title="Delete your comment"
										className="shrink-0 text-text-muted opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100 disabled:opacity-30"
									>
										<Trash2 className="size-3.5" aria-hidden />
									</button>
								)}
							</div>
						</li>
					))
				)}
			</ul>
		</div>
	);
}

/**
 * Convenience: bind a Convex mutation reference to the (id, body) shape
 * required by CommentThread.onPost. Use like:
 *   const post = useBoundCommentPost(api.projectIdeas.commentOnIdea, { ideaId });
 */
type AnyMutation = FunctionReference<"mutation", "public" | "internal">;
export function useBoundCommentPost<M extends AnyMutation>(
	mutationRef: M,
	staticArgs: Record<string, unknown>,
) {
	const fn = useMutation(mutationRef);
	return async (body: string) => {
		await fn({ ...staticArgs, body } as Parameters<typeof fn>[0]);
	};
}

export function useBoundCommentDelete<M extends AnyMutation>(
	mutationRef: M,
	argKey: string,
) {
	const fn = useMutation(mutationRef);
	return async (commentId: string) => {
		await fn({ [argKey]: commentId } as Parameters<typeof fn>[0]);
	};
}
