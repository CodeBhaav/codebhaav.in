import { useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Check, HandHelping } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	interested: boolean;
	count: number;
	onToggle: () => Promise<void>;
	disabled?: boolean;
	/**
	 * The plan says "I wanna build this" is visible from the start but
	 * should be a secondary CTA so it doesn't overshadow the discussion.
	 * Set variant="primary" only when this is the page's main action
	 * (e.g. for shipped projects when the discussion is past tense).
	 */
	variant?: "primary" | "secondary";
}

export function InterestButton({
	interested,
	count,
	onToggle,
	disabled,
	variant = "secondary",
}: Props) {
	const { user, isLoaded } = useUser();
	const { openSignIn } = useClerk();
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		if (pending || disabled) return;
		if (isLoaded && !user) {
			openSignIn();
			return;
		}
		setPending(true);
		try {
			await onToggle();
		} finally {
			setPending(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				disabled={disabled || pending}
				onClick={handleClick}
				aria-pressed={interested}
				className={cn(
					"inline-flex h-9 items-center gap-2 rounded-button px-3.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
					interested
						? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
						: variant === "primary"
							? "bg-accent text-[#1a1208] hover:bg-accent-hover"
							: "border border-border bg-card text-text-secondary hover:border-border-hover hover:text-text-primary",
				)}
			>
				{interested ? (
					<>
						<Check className="size-3.5" strokeWidth={3} aria-hidden />
						You're in
					</>
				) : (
					<>
						<HandHelping className="size-3.5" aria-hidden />
						I wanna build this
					</>
				)}
			</button>
			<span className="font-mono text-[11px] text-text-muted">
				{count} {count === 1 ? "volunteer" : "volunteers"}
			</span>
		</div>
	);
}
