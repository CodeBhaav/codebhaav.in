import { useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import {
	ChevronDown,
	ChevronRight,
	CornerDownRight,
	Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import {
	MentionComposer,
	type Mention,
	RenderedBody,
	mentionHandle,
} from "./MentionComposer";

export interface CommentItem {
	id: string;
	authorName: string;
	authorUsername?: string | null;
	clerkUserId: string;
	body: string;
	createdAt: number;
	mine: boolean;
	parentId: string | null;
	mentions: Mention[];
}

interface PostArgs {
	body: string;
	parentId?: string;
	mentions: Mention[];
}

interface Props {
	comments: CommentItem[];
	onPost: (args: PostArgs) => Promise<void>;
	onDelete: (commentId: string) => Promise<void>;
	placeholder?: string;
	className?: string;
}

interface TreeNode {
	comment: CommentItem;
	children: TreeNode[];
}

const MAX_VISUAL_DEPTH = 5;

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countDescendants(node: TreeNode): number {
	let n = 0;
	for (const child of node.children) {
		n += 1 + countDescendants(child);
	}
	return n;
}

function buildTree(comments: CommentItem[]): TreeNode[] {
	const byId = new Map<string, TreeNode>();
	for (const c of comments) {
		byId.set(c.id, { comment: c, children: [] });
	}
	const roots: TreeNode[] = [];
	for (const c of comments) {
		const node = byId.get(c.id)!;
		if (c.parentId && byId.has(c.parentId)) {
			byId.get(c.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}
	const sortByTime = (a: TreeNode, b: TreeNode) =>
		a.comment.createdAt - b.comment.createdAt;
	roots.sort(sortByTime);
	for (const node of byId.values()) node.children.sort(sortByTime);
	return roots;
}

export function CommentThread({
	comments,
	onPost,
	onDelete,
	placeholder = "Add a comment, suggestion, or question. Type @ to mention someone.",
	className,
}: Props) {
	const { user, isLoaded } = useUser();
	const [draft, setDraft] = useState("");
	const [draftMentions, setDraftMentions] = useState<Mention[]>([]);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const tree = useMemo(() => buildTree(comments), [comments]);
	// id -> { authorName, authorUsername } for "Replying to @X" line.
	const parentMeta = useMemo(() => {
		const map = new Map<
			string,
			{ name: string; username?: string }
		>();
		for (const c of comments) {
			map.set(c.id, {
				name: c.authorName,
				username: c.authorUsername ?? undefined,
			});
		}
		return map;
	}, [comments]);

	const handlePost = async () => {
		const body = draft.trim();
		if (!body || posting) return;
		setPosting(true);
		setError(null);
		try {
			// Only keep mentions whose handle still appears in the body.
			const stillMentioned = draftMentions.filter((m) => {
				const handle = mentionHandle(m);
				return new RegExp(`@${escapeRegExp(handle)}\\b`, "i").test(body);
			});
			await onPost({ body, mentions: stillMentioned });
			setDraft("");
			setDraftMentions([]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to post");
		} finally {
			setPosting(false);
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
						<SignInButton mode="modal">
							<button
								type="button"
								className="text-accent hover:text-accent-hover"
							>
								Sign in
							</button>
						</SignInButton>{" "}
						to join the discussion.
					</p>
				</div>
			) : (
				<Composer
					value={draft}
					mentions={draftMentions}
					onChange={(v, m) => {
						setDraft(v);
						setDraftMentions(m);
					}}
					onSubmit={handlePost}
					posting={posting}
					placeholder={placeholder}
				/>
			)}

			{error && (
				<p className="text-xs text-rose-300" role="alert">
					{error}
				</p>
			)}

			{tree.length === 0 ? (
				<div className="rounded-[6px] border border-dashed border-border bg-background/40 px-4 py-6 text-center text-sm text-text-muted">
					No comments yet. Be the first.
				</div>
			) : (
				<ul className="space-y-3">
					{tree.map((node) => (
						<CommentNode
							key={node.comment.id}
							node={node}
							depth={0}
							parentMeta={parentMeta}
							onPost={onPost}
							onDelete={onDelete}
						/>
					))}
				</ul>
			)}
		</div>
	);
}

function CommentNode({
	node,
	depth,
	parentMeta,
	onPost,
	onDelete,
}: {
	node: TreeNode;
	depth: number;
	parentMeta: Map<string, { name: string; username?: string }>;
	onPost: Props["onPost"];
	onDelete: Props["onDelete"];
}) {
	const { user } = useUser();
	const [replying, setReplying] = useState(false);
	const [replyDraft, setReplyDraft] = useState("");
	const [replyMentions, setReplyMentions] = useState<Mention[]>([]);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [collapsed, setCollapsed] = useState(false);

	const { comment } = node;
	const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
	const parent =
		comment.parentId ? parentMeta.get(comment.parentId) : null;
	const childCount = node.children.length;
	const descendantCount = useMemo(() => countDescendants(node), [node]);

	const startReply = () => {
		if (!user) {
			window.location.href = "/sign-in";
			return;
		}
		// Don't prefill an @mention when you're replying to yourself  it's
		// noise. Just open the composer empty so you can think out loud.
		if (comment.mine) {
			setReplyDraft("");
			setReplyMentions([]);
		} else {
			const handle = mentionHandle({
				name: comment.authorName,
				username: comment.authorUsername ?? undefined,
			});
			const prefill = `@${handle} `;
			setReplyDraft(prefill);
			setReplyMentions([
				{
					clerkUserId: comment.clerkUserId,
					name: comment.authorName,
					username: comment.authorUsername ?? undefined,
				},
			]);
		}
		setReplying(true);
	};

	const cancelReply = () => {
		setReplying(false);
		setReplyDraft("");
		setReplyMentions([]);
		setError(null);
	};

	const submitReply = async () => {
		const body = replyDraft.trim();
		if (!body || pending) return;
		setPending(true);
		setError(null);
		try {
			const stillMentioned = replyMentions.filter((m) => {
				const handle = mentionHandle(m);
				return new RegExp(`@${escapeRegExp(handle)}\\b`, "i").test(body);
			});
			await onPost({
				body,
				parentId: comment.id,
				mentions: stillMentioned,
			});
			cancelReply();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to reply");
		} finally {
			setPending(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Delete this comment?")) return;
		setDeleting(true);
		try {
			await onDelete(comment.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to delete");
		} finally {
			setDeleting(false);
		}
	};

	const parentHandle = parent
		? mentionHandle({ name: parent.name, username: parent.username })
		: null;

	return (
		<li>
			<div
				className={cn(
					"group rounded-[6px] border border-border bg-card px-4 py-3",
					depth > 0 && "bg-card/60",
				)}
			>
				{/* "Replying to @X" breadcrumb so distant replies still feel attached */}
				{parent && parentHandle && (
					<p className="mb-1.5 flex items-center gap-1 font-mono text-[10px] text-text-muted">
						<CornerDownRight className="size-3" aria-hidden />
						<span>replying to</span>
						<span className="text-accent">@{parentHandle}</span>
					</p>
				)}
				<div className="flex items-start gap-3">
					<Avatar name={comment.authorName} size={28} />
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-baseline gap-2">
							<p className="text-sm font-medium text-text-primary">
								{comment.authorName}
							</p>
							{comment.authorUsername && (
								<span className="font-mono text-[11px] text-text-muted">
									@{comment.authorUsername}
								</span>
							)}
							<span className="font-mono text-[10px] text-text-muted">
								{formatRelative(comment.createdAt)}
							</span>
							{depth >= MAX_VISUAL_DEPTH && (
								<span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-text-muted/70">
									<CornerDownRight className="size-3" aria-hidden />
									deep reply
								</span>
							)}
						</div>
						<div className="mt-1.5">
							<RenderedBody
								body={comment.body}
								mentions={comment.mentions}
							/>
						</div>
						<div className="mt-2 flex items-center gap-3">
							<button
								type="button"
								onClick={startReply}
								className="font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
							>
								Reply
							</button>
							{childCount > 0 && (
								<button
									type="button"
									onClick={() => setCollapsed((c) => !c)}
									className="inline-flex items-center gap-1 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
								>
									{collapsed ? (
										<>
											<ChevronRight className="size-3" aria-hidden />
											Show {descendantCount}{" "}
											{descendantCount === 1 ? "reply" : "replies"}
										</>
									) : (
										<>
											<ChevronDown className="size-3" aria-hidden />
											Hide replies
										</>
									)}
								</button>
							)}
							{comment.mine && (
								<button
									type="button"
									disabled={deleting}
									onClick={handleDelete}
									className="inline-flex items-center gap-1 font-mono text-[11px] text-text-muted transition-colors hover:text-rose-300 disabled:opacity-40"
									title="Delete your comment"
								>
									<Trash2 className="size-3" aria-hidden />
									Delete
								</button>
							)}
						</div>
					</div>
				</div>

				{replying && (
					<div className="mt-3 ml-10 rounded-[6px] border border-border bg-background/40">
						<Composer
							value={replyDraft}
							mentions={replyMentions}
							onChange={(v, m) => {
								setReplyDraft(v);
								setReplyMentions(m);
							}}
							onSubmit={submitReply}
							onCancel={cancelReply}
							posting={pending}
							placeholder={`Reply to ${comment.authorName}…`}
							autoFocus
							compact
						/>
						{error && (
							<p className="px-3 pb-2 text-xs text-rose-300">{error}</p>
						)}
					</div>
				)}
			</div>

			{node.children.length > 0 && !collapsed && (
				<ul
					className={cn(
						"mt-2 space-y-2 border-l border-border",
						visualDepth < MAX_VISUAL_DEPTH ? "ml-4 pl-3" : "ml-0 pl-0 border-l-0",
					)}
				>
					{node.children.map((child) => (
						<CommentNode
							key={child.comment.id}
							node={child}
							depth={depth + 1}
							parentMeta={parentMeta}
							onPost={onPost}
							onDelete={onDelete}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

function Composer({
	value,
	mentions,
	onChange,
	onSubmit,
	onCancel,
	posting,
	placeholder,
	autoFocus,
	compact,
}: {
	value: string;
	mentions: Mention[];
	onChange: (value: string, mentions: Mention[]) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	posting: boolean;
	placeholder?: string;
	autoFocus?: boolean;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-card border bg-card",
				compact ? "border-transparent" : "border-border",
			)}
		>
			<MentionComposer
				value={value}
				mentions={mentions}
				onChange={onChange}
				placeholder={placeholder}
				rows={compact ? 2 : 3}
				autoFocus={autoFocus}
			/>
			<div
				className={cn(
					"flex items-center justify-between gap-3 border-t border-border px-4 py-2.5",
					compact && "border-t-0 pt-0 pb-2",
				)}
			>
				<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
					{value.trim().length}/2000 · type @ to mention
				</span>
				<div className="flex items-center gap-2">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="font-mono text-[11px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
						>
							Cancel
						</button>
					)}
					<button
						type="button"
						disabled={posting || value.trim().length === 0}
						onClick={onSubmit}
						className="inline-flex h-8 items-center rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
					>
						{posting ? "Posting…" : onCancel ? "Reply" : "Post"}
					</button>
				</div>
			</div>
		</div>
	);
}
