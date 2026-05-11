import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
	projectId: string;
	techStack: string[];
	canEdit: boolean;
}

export function TechStackCard({ projectId, techStack, canEdit }: Props) {
	const updateProject = useMutation(api.projects.updateProject);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<string[]>(techStack);
	const [input, setInput] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keep local draft in sync if the upstream value changes between edits.
	useEffect(() => {
		if (!editing) setDraft(techStack);
	}, [techStack, editing]);

	const addTag = () => {
		const t = input.trim();
		if (!t) return;
		if (draft.includes(t)) {
			setInput("");
			return;
		}
		if (draft.length >= 12) {
			setError("12 tags max");
			return;
		}
		setError(null);
		setDraft([...draft, t]);
		setInput("");
	};

	const removeTag = (t: string) => {
		setDraft(draft.filter((x) => x !== t));
	};

	const save = async () => {
		setPending(true);
		setError(null);
		try {
			await updateProject({
				projectId: projectId as Id<"project">,
				techStack: draft,
			});
			setEditing(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to save");
		} finally {
			setPending(false);
		}
	};

	const cancel = () => {
		setDraft(techStack);
		setInput("");
		setError(null);
		setEditing(false);
	};

	const empty = techStack.length === 0;

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<header className="flex items-center justify-between gap-2">
				<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
					Tech stack
				</p>
				{canEdit && !editing && (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
					>
						<Pencil className="size-3" aria-hidden />
						{empty ? "Add" : "Edit"}
					</button>
				)}
			</header>

			{!editing ? (
				empty ? (
					<EmptyState
						canEdit={canEdit}
						onEdit={() => setEditing(true)}
					/>
				) : (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{techStack.map((t) => (
							<span
								key={t}
								className="inline-flex items-center rounded-[4px] border border-border bg-surface/60 px-2 py-1 font-mono text-[11px] text-text-secondary"
							>
								{t}
							</span>
						))}
					</div>
				)
			) : (
				<div className="mt-3 space-y-3">
					<div className="flex gap-2">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addTag();
								}
							}}
							placeholder="React, Convex, Postgres…"
							className="h-8 flex-1 rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
						/>
						<button
							type="button"
							onClick={addTag}
							className="inline-flex h-8 items-center rounded-button border border-border bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
						>
							<Plus className="size-3.5" aria-hidden />
						</button>
					</div>
					{draft.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{draft.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => removeTag(t)}
									className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-rose-500/40 hover:text-rose-300"
								>
									{t}
									<X className="size-3" aria-hidden />
								</button>
							))}
						</div>
					)}
					{error && (
						<p className="text-[11px] text-rose-300" role="alert">
							{error}
						</p>
					)}
					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={cancel}
							className="font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={pending}
							onClick={save}
							className={cn(
								"inline-flex h-8 items-center gap-1 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover",
								pending && "opacity-50 cursor-not-allowed",
							)}
						>
							<Check className="size-3.5" aria-hidden />
							{pending ? "Saving…" : "Save"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function EmptyState({
	canEdit,
	onEdit,
}: {
	canEdit: boolean;
	onEdit: () => void;
}) {
	return (
		<div className="mt-3">
			<p className="text-sm text-text-secondary">
				Not decided yet.
			</p>
			<p className="mt-1 text-xs text-text-muted leading-relaxed">
				The community is still shaping how this will be built. Comment your
				suggestions below.
			</p>
			{canEdit && (
				<button
					type="button"
					onClick={onEdit}
					className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-accent hover:text-accent-hover"
				>
					<Plus className="size-3" aria-hidden />
					Add the stack
				</button>
			)}
		</div>
	);
}
