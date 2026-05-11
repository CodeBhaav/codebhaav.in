import { useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { ChevronRight, MessageSquare, Rocket, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
	Avatar,
	EmptyState,
	PageHeader,
	Panel,
	PanelHeader,
	formatRelative,
} from "./AdminOverview";
import { MAX_CATEGORIES_PER_ROW } from "../../../../convex/projectCategories";
import { CategoryPicker } from "../projects/CategoryPicker";

type StatusFilter = "all" | "open" | "promoted" | "rejected";

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
	{ key: "all", label: "All" },
	{ key: "open", label: "Open" },
	{ key: "promoted", label: "Promoted" },
	{ key: "rejected", label: "Rejected" },
];

export function AdminIdeasPanel() {
	const { user } = useUser();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
	const [search, setSearch] = useState("");
	const [promoteId, setPromoteId] = useState<string | null>(null);
	const [rejectId, setRejectId] = useState<string | null>(null);

	const ideas = useQuery(
		api.projectIdeas.listIdeasForAdmin,
		user ? { status: statusFilter } : "skip",
	);
	const rejectIdea = useMutation(api.projectIdeas.rejectIdea);
	const reopenIdea = useMutation(api.projectIdeas.reopenIdea);
	const promoteIdea = useMutation(api.projectIdeas.promoteIdeaToProject);

	const counts = useMemo(() => {
		const out: Record<StatusFilter, number> = {
			all: 0,
			open: 0,
			promoted: 0,
			rejected: 0,
		};
		if (ideas) out.all = ideas.length;
		return out;
	}, [ideas]);

	const filtered = useMemo(() => {
		if (!ideas) return [];
		const q = search.trim().toLowerCase();
		if (!q) return ideas;
		return ideas.filter(
			(i) =>
				i.title.toLowerCase().includes(q) ||
				i.submitterName.toLowerCase().includes(q) ||
				i.submitterEmail.toLowerCase().includes(q),
		);
	}, [ideas, search]);

	const promoteIdea_row =
		ideas?.find((i) => i.id === promoteId) ?? null;
	const rejectIdea_row = ideas?.find((i) => i.id === rejectId) ?? null;

	return (
		<div className="space-y-8">
			<PageHeader
				eyebrow="Admin"
				title="Ideas"
				subtitle="Community-submitted ideas. Promote the strongest to a project, reject the ones that don't fit."
			/>

			<Panel padded={false}>
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
					<PanelHeader
						title="All submissions"
						subtitle={`${filtered.length} ${filtered.length === 1 ? "row" : "rows"} · sorted by upvotes`}
						inline
					/>
					<input
						type="search"
						placeholder="Search title, name, email…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-9 w-56 rounded-button border border-border bg-surface px-3 text-xs text-text-primary placeholder:text-text-muted transition-colors hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-3 sm:px-6">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => setStatusFilter(f.key)}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-medium transition-colors",
								statusFilter === f.key
									? "bg-accent/10 text-accent"
									: "text-text-secondary hover:bg-surface hover:text-text-primary",
							)}
						>
							{f.label}
							{statusFilter === f.key && (
								<span className="rounded-[3px] bg-accent/20 px-1 font-mono text-[10px] tabular-nums text-accent">
									{counts.all}
								</span>
							)}
						</button>
					))}
				</div>

				{ideas === undefined ? (
					<div className="px-6 py-12">
						<div className="h-24 animate-pulse rounded-card bg-surface" />
					</div>
				) : filtered.length === 0 ? (
					<div className="px-6 py-12">
						<EmptyState message="No ideas in this view." />
					</div>
				) : (
					<ul className="divide-y divide-border">
						{filtered.map((idea) => (
							<li
								key={idea.id}
								className="px-6 py-4 transition-colors hover:bg-surface/40"
							>
								<div className="flex items-start gap-4">
									<div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-button border border-border bg-card py-2">
										<span
											className={cn(
												"font-mono text-base font-semibold tabular-nums",
												idea.upvoteCount - idea.downvoteCount > 0
													? "text-text-primary"
													: idea.upvoteCount - idea.downvoteCount < 0
														? "text-rose-300"
														: "text-text-muted",
											)}
										>
											{idea.upvoteCount - idea.downvoteCount}
										</span>
										<span className="mt-0.5 font-mono text-[9px] text-text-muted">
											<span className="text-emerald-300/80">
												{idea.upvoteCount}↑
											</span>{" "}
											<span className="text-rose-300/80">
												{idea.downvoteCount}↓
											</span>
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<a
											href={`/ideas/${idea.id}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-base font-semibold text-text-primary transition-colors hover:text-accent"
										>
											{idea.title}
											<ChevronRight className="size-3.5" aria-hidden />
										</a>
										<p className="mt-1 line-clamp-2 text-sm text-text-secondary">
											{idea.description}
										</p>
										<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
											<span className="inline-flex items-center gap-1.5">
												<Avatar name={idea.submitterName} size={18} />
												{idea.submitterName}
											</span>
											<span className="font-mono">{idea.submitterEmail}</span>
											<span className="font-mono">
												{formatRelative(idea.submittedAt)}
											</span>
											<span className="inline-flex items-center gap-1 font-mono">
												<MessageSquare className="size-3" aria-hidden />
												{idea.commentCount}
											</span>
											<IdeaStatusPill status={idea.status} />
										</div>
										{idea.rejectedReason && (
											<p className="mt-2 text-xs text-rose-300/80">
												<span className="font-mono uppercase tracking-widest text-rose-300/60">
													Reason:
												</span>{" "}
												{idea.rejectedReason}
											</p>
										)}
									</div>
									<div className="flex shrink-0 flex-wrap items-center gap-1.5">
										{idea.status === "open" && (
											<>
												<button
													type="button"
													onClick={() => setPromoteId(idea.id)}
													className="inline-flex h-8 items-center gap-1.5 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
												>
													<Rocket className="size-3.5" aria-hidden />
													Promote
												</button>
												<button
													type="button"
													onClick={() => setRejectId(idea.id)}
													className="inline-flex h-8 items-center rounded-button border border-border bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-rose-500/50 hover:text-rose-300"
												>
													Reject
												</button>
											</>
										)}
										{idea.status === "rejected" && (
											<button
												type="button"
												onClick={async () => {
													await reopenIdea({
														ideaId: idea.id as Id<"projectIdea">,
													});
												}}
												className="inline-flex h-8 items-center rounded-button border border-border bg-background px-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
											>
												Reopen
											</button>
										)}
										{idea.status === "promoted" &&
											idea.promotedToProjectId && (
												<a
													href="/admin/projects"
													className="inline-flex h-8 items-center gap-1 rounded-button border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300"
												>
													<Rocket className="size-3" aria-hidden />
													Project
												</a>
											)}
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</Panel>

			{promoteIdea_row && (
				<PromoteModal
					idea={promoteIdea_row}
					onClose={() => setPromoteId(null)}
					onPromote={async (args) => {
						const res = await promoteIdea({
							ideaId: args.ideaId as Id<"projectIdea">,
							title: args.title,
							description: args.description,
							techStack: args.techStack,
							...(args.categories.length > 0
								? { categories: args.categories }
								: {}),
						});
						setPromoteId(null);
						window.location.href = `/admin/projects/${res.slug}`;
					}}
				/>
			)}

			{rejectIdea_row && (
				<RejectModal
					idea={rejectIdea_row}
					onClose={() => setRejectId(null)}
					onReject={async (reason) => {
						await rejectIdea({
							ideaId: rejectIdea_row.id as Id<"projectIdea">,
							reason: reason || undefined,
						});
						setRejectId(null);
					}}
				/>
			)}
		</div>
	);
}

function IdeaStatusPill({
	status,
}: {
	status: "open" | "promoted" | "rejected";
}) {
	const cfg = {
		open: { label: "Open", classes: "border-border bg-surface text-text-secondary" },
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
			className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cfg.classes}`}
		>
			{cfg.label}
		</span>
	);
}

interface PromoteArgs {
	ideaId: string;
	title: string;
	description: string;
	techStack: string[];
	categories: string[];
}

function PromoteModal({
	idea,
	onClose,
	onPromote,
}: {
	idea: {
		id: string;
		title: string;
		description: string;
		categories: string[];
	};
	onClose: () => void;
	onPromote: (args: PromoteArgs) => Promise<void>;
}) {
	const [title, setTitle] = useState(idea.title);
	const [description, setDescription] = useState(idea.description);
	const [techInput, setTechInput] = useState("");
	const [techStack, setTechStack] = useState<string[]>([]);
	const [categories, setCategories] = useState<string[]>(idea.categories);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addTech = () => {
		const t = techInput.trim();
		if (!t) return;
		if (techStack.includes(t)) return;
		if (techStack.length >= 12) return;
		setTechStack((s) => [...s, t]);
		setTechInput("");
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await onPromote({
				ideaId: idea.id,
				title: title.trim(),
				description: description.trim(),
				techStack,
				categories,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to promote");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-2xl rounded-card border border-border bg-card shadow-2xl">
				<header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Promote to project
						</p>
						<h2 className="mt-0.5 text-lg font-semibold tracking-tight text-text-primary">
							New project from idea
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
					>
						<X className="size-4" aria-hidden />
					</button>
				</header>
				<div className="space-y-4 px-6 py-5">
					<label className="block">
						<span className="text-xs font-medium text-text-secondary">
							Title
						</span>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={140}
							className="mt-1.5 w-full rounded-button border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
						/>
					</label>
					<label className="block">
						<span className="text-xs font-medium text-text-secondary">
							Description
						</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={6}
							maxLength={4000}
							className="mt-1.5 w-full resize-y rounded-button border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
						/>
					</label>
					<div>
						<span className="text-xs font-medium text-text-secondary">
							Tech stack (up to 12)
						</span>
						<div className="mt-1.5 flex gap-2">
							<input
								type="text"
								value={techInput}
								onChange={(e) => setTechInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTech();
									}
								}}
								placeholder="React, Convex, Postgres…"
								className="h-9 flex-1 rounded-button border border-border bg-background px-3 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
							/>
							<button
								type="button"
								onClick={addTech}
								className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-3 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
							>
								Add
							</button>
						</div>
						{techStack.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1.5">
								{techStack.map((t) => (
									<button
										key={t}
										type="button"
										onClick={() =>
											setTechStack((s) => s.filter((x) => x !== t))
										}
										className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-rose-500/40 hover:text-rose-300"
									>
										{t}
										<X className="size-3" aria-hidden />
									</button>
								))}
							</div>
						)}
					</div>
					<div>
						<div className="flex items-baseline justify-between">
							<span className="text-xs font-medium text-text-secondary">
								Categories
							</span>
							<span className="font-mono text-[10px] text-text-muted">
								up to {MAX_CATEGORIES_PER_ROW}
							</span>
						</div>
						<CategoryPicker
							className="mt-1.5"
							value={categories}
							onChange={setCategories}
						/>
					</div>
					{error && (
						<p className="text-xs text-rose-300" role="alert">
							{error}
						</p>
					)}
				</div>
				<footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-9 items-center rounded-button border border-border bg-background px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={submitting}
						onClick={handleSubmit}
						className="inline-flex h-9 items-center gap-1.5 rounded-button bg-accent px-3.5 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Rocket className="size-3.5" aria-hidden />
						{submitting ? "Promoting…" : "Promote to project"}
					</button>
				</footer>
			</div>
		</div>
	);
}

function RejectModal({
	idea,
	onClose,
	onReject,
}: {
	idea: { title: string };
	onClose: () => void;
	onReject: (reason: string) => Promise<void>;
}) {
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			await onReject(reason.trim());
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-card border border-border bg-card shadow-2xl">
				<header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Reject idea
						</p>
						<h2 className="mt-0.5 text-lg font-semibold tracking-tight text-text-primary line-clamp-1">
							{idea.title}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
					>
						<X className="size-4" aria-hidden />
					</button>
				</header>
				<div className="space-y-3 px-6 py-5">
					<p className="text-xs text-text-muted">
						Optional: a short note shown to the submitter on the rejected
						idea page.
					</p>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={4}
						maxLength={500}
						placeholder="e.g. Too similar to an existing project, scope too large for a community build…"
						className="w-full resize-y rounded-button border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
					/>
				</div>
				<footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-9 items-center rounded-button border border-border bg-background px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={submitting}
						onClick={handleSubmit}
						className="inline-flex h-9 items-center rounded-button border border-rose-500/40 bg-rose-500/10 px-3.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitting ? "Rejecting…" : "Reject"}
					</button>
				</footer>
			</div>
		</div>
	);
}
