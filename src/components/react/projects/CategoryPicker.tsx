import {
	CATEGORIES,
	CATEGORY_KEYS,
	MAX_CATEGORIES_PER_ROW,
	type CategoryKey,
} from "../../../../convex/projectCategories";
import { cn } from "@/lib/utils";

interface Props {
	value: string[];
	onChange: (next: string[]) => void;
	className?: string;
	disabled?: boolean;
}

const ALL_KEYS = new Set<string>(CATEGORY_KEYS);

/**
 * Reusable multi-select chip picker. Max selection capped at
 * MAX_CATEGORIES_PER_ROW; clicking a selected chip deselects it.
 * Click on disabled chip (when cap hit) is a no-op.
 */
export function CategoryPicker({ value, onChange, className, disabled }: Props) {
	const selected = new Set(value.filter((v) => ALL_KEYS.has(v)));
	const atCap = selected.size >= MAX_CATEGORIES_PER_ROW;

	const toggle = (key: CategoryKey) => {
		if (disabled) return;
		const next = new Set(selected);
		if (next.has(key)) {
			next.delete(key);
		} else {
			if (atCap) return;
			next.add(key);
		}
		// Preserve insertion order for stability across renders.
		const ordered = CATEGORY_KEYS.filter((k) => next.has(k));
		onChange(ordered);
	};

	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{CATEGORY_KEYS.map((key) => {
				const isSelected = selected.has(key);
				const isDimmed = !isSelected && atCap;
				return (
					<button
						key={key}
						type="button"
						onClick={() => toggle(key)}
						disabled={disabled || isDimmed}
						className={cn(
							"inline-flex h-7 items-center rounded-[4px] border px-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
							isSelected
								? "border-accent/40 bg-accent/10 text-accent"
								: isDimmed
									? "border-border bg-surface/40 text-text-muted/60 cursor-not-allowed"
									: "border-border bg-surface/60 text-text-secondary hover:border-border-hover hover:text-text-primary",
						)}
						aria-pressed={isSelected}
					>
						{CATEGORIES[key].label}
					</button>
				);
			})}
		</div>
	);
}

export function CategoryPills({
	categories,
	className,
	size = "sm",
}: {
	categories: string[];
	className?: string;
	size?: "sm" | "xs";
}) {
	const valid = categories.filter((c) => ALL_KEYS.has(c)) as CategoryKey[];
	if (valid.length === 0) return null;
	return (
		<div className={cn("flex flex-wrap gap-1", className)}>
			{valid.map((key) => (
				<span
					key={key}
					className={cn(
						"inline-flex items-center rounded-[4px] border border-accent/30 bg-accent/[0.07] font-mono uppercase tracking-wider text-accent",
						size === "xs"
							? "px-1.5 py-0 text-[9px]"
							: "px-1.5 py-0.5 text-[10px]",
					)}
				>
					{CATEGORIES[key].label}
				</span>
			))}
		</div>
	);
}
