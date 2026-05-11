import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, formatRelative } from "../admin/AdminOverview";

interface Props {
	projectId: string;
	projectSlug: string;
	canPost: boolean;
}

const TITLE_MAX = 120;
const BODY_MAX = 4000;

export function ProjectUpdatesTimeline({
	projectId,
	canPost,
}: Props) {
	const updates = useQuery(api.projects.listProjectUpdates, {
		projectId: projectId as Id<"project">,
	});
	const post = useMutation(api.projects.postProjectUpdate);
	const remove = useMutation(api.projects.deleteProjectUpdate);
	const [composerOpen, setComposerOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePost = async () => {
		setPosting(true);
		setError(null);
		try {
			await post({
				projectId: projectId as Id<"project">,
				title: title.trim(),
				body: body.trim(),
			});
			setTitle("");
			setBody("");
			setComposerOpen(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to post update");
		} finally {
			setPosting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this update?")) return;
		try {
			await remove({ updateId: id as Id<"projectUpdate"> });
		} catch (e) {
			alert(e instanceof Error ? e.message : "Failed to delete");
		}
	};

	const hasUpdates = updates && updates.length > 0;
	if (!canPost && !hasUpdates) return null;

	return (
		<section className="rounded-card border border-border bg-card p-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Megaphone className="size-4 text-accent" aria-hidden />
					<h3 className="text-base font-semibold tracking-tight text-text-primary">
						Build updates
					</h3>
					{updates && (
						<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							{updates.length}
						</span>
					)}
				</div>
				{canPost && !composerOpen && (
					<button
						type="button"
						onClick={() => setComposerOpen(true)}
						className="inline-flex h-8 items-center gap-1.5 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
					>
						<Plus className="size-3.5" aria-hidden />
						Post update
					</button>
				)}
			</header>

			{composerOpen && (
				<div className="mt-4 rounded-card border border-border bg-background/40 p-4">
					<label className="block">
						<span className="text-xs font-medium text-text-secondary">
							Title
						</span>
						<input
							type="text"
							value={title}
							maxLength={TITLE_MAX}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="What did the team ship this week?"
							className="mt-1.5 w-full rounded-button border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
						/>
						<div className="mt-1 flex items-center justify-end font-mono text-[10px] text-text-muted">
							{title.length}/{TITLE_MAX}
						</div>
					</label>
					<label className="mt-3 block">
						<span className="text-xs font-medium text-text-secondary">
							Body
						</span>
						<textarea
							value={body}
							maxLength={BODY_MAX}
							onChange={(e) => setBody(e.target.value)}
							rows={5}
							placeholder="What did you build, what's next, what do you need help with?"
							className="mt-1.5 w-full resize-y rounded-button border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 min-h-[120px]"
						/>
						<div className="mt-1 flex items-center justify-end font-mono text-[10px] text-text-muted">
							{body.length}/{BODY_MAX}
						</div>
					</label>
					{error && (
						<p className="mt-2 text-xs text-rose-300" role="alert">
							{error}
						</p>
					)}
					<div className="mt-3 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={() => {
								setComposerOpen(false);
								setError(null);
							}}
							className="font-mono text-[11px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={
								posting ||
								title.trim().length === 0 ||
								body.trim().length === 0
							}
							onClick={handlePost}
							className={cn(
								"inline-flex h-8 items-center rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover",
								(posting ||
									title.trim().length === 0 ||
									body.trim().length === 0) &&
									"opacity-50 cursor-not-allowed",
							)}
						>
							{posting ? "Posting" : "Post update"}
						</button>
					</div>
				</div>
			)}

			{updates === undefined ? (
				<div className="mt-4 space-y-3">
					{[1, 2].map((i) => (
						<div
							key={i}
							className="h-20 animate-pulse rounded-[6px] border border-border bg-background/40"
						/>
					))}
				</div>
			) : updates.length === 0 ? (
				!composerOpen && (
					<p className="mt-4 text-sm text-text-muted">
						{canPost
							? "Drop a build update so the community knows what's happening."
							: "No updates yet."}
					</p>
				)
			) : (
				<ul className="mt-4 space-y-3">
					{updates.map((u) => (
						<li
							key={u.id}
							className="relative rounded-[6px] border border-border bg-background/40 pl-4"
						>
							<span
								className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-[2px] bg-accent/60"
								aria-hidden
							/>
							<div className="px-4 py-3">
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<h4 className="text-sm font-semibold text-text-primary">
										{u.title}
									</h4>
									<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
										{formatRelative(u.createdAt)}
									</span>
								</div>
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
									{u.body}
								</p>
								<div className="mt-3 flex items-center justify-between gap-3">
									<div className="flex items-center gap-2">
										<Avatar name={u.authorName} size={20} />
										{u.authorUsername ? (
											<a
												href={`/u/${u.authorUsername}`}
												className="text-[11px] font-medium text-text-secondary transition-colors hover:text-accent"
											>
												{u.authorName}
											</a>
										) : (
											<span className="text-[11px] font-medium text-text-secondary">
												{u.authorName}
											</span>
										)}
									</div>
									{u.mine && (
										<button
											type="button"
											onClick={() => handleDelete(u.id)}
											className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-rose-300"
										>
											<Trash2 className="size-3" aria-hidden />
											Delete
										</button>
									)}
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
