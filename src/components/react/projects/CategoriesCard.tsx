import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Check, Pencil } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
	CATEGORIES,
	CATEGORY_KEYS,
	MAX_CATEGORIES_PER_ROW,
} from "../../../../convex/projectCategories";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { CategoryPicker } from "./CategoryPicker";

interface Props {
	projectId: string;
	categories: string[];
	canEdit: boolean;
}

const VALID_KEYS = new Set<string>(CATEGORY_KEYS);

export function CategoriesCard({ projectId, categories, canEdit }: Props) {
	const updateProject = useMutation(api.projects.updateProject);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<string[]>(categories);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!editing) setDraft(categories);
	}, [categories, editing]);

	const empty = categories.filter((c) => VALID_KEYS.has(c)).length === 0;
	if (!canEdit && empty) return null;

	const save = async () => {
		setPending(true);
		setError(null);
		try {
			await updateProject({
				projectId: projectId as Id<"project">,
				categories: draft,
			});
			setEditing(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to save");
		} finally {
			setPending(false);
		}
	};

	const cancel = () => {
		setDraft(categories);
		setError(null);
		setEditing(false);
	};

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<header className="flex items-center justify-between gap-2">
				<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
					Categories
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
					<p className="mt-3 text-xs text-text-muted leading-relaxed">
						Not tagged yet.
					</p>
				) : (
					<div className="mt-3 flex flex-wrap gap-1.5">
						{categories
							.filter((c) => VALID_KEYS.has(c))
							.map((key) => (
								<span
									key={key}
									className="inline-flex items-center rounded-[4px] border border-accent/30 bg-accent/[0.07] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent"
								>
									{CATEGORIES[key as keyof typeof CATEGORIES].label}
								</span>
							))}
					</div>
				)
			) : (
				<div className="mt-3 space-y-3">
					<CategoryPicker value={draft} onChange={setDraft} />
					<p className="text-[11px] text-text-muted">
						Pick up to {MAX_CATEGORIES_PER_ROW}. Used for filtering on the
						projects list.
					</p>
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
							{pending ? "Saving" : "Save"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
