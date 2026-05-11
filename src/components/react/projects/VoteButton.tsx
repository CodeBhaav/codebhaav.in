import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	count: number;
	voted: boolean;
	onToggle: () => Promise<void>;
	size?: "sm" | "lg";
	disabled?: boolean;
}

export function VoteButton({
	count,
	voted,
	onToggle,
	size = "sm",
	disabled,
}: Props) {
	const { user, isLoaded } = useUser();
	const [pending, setPending] = useState(false);

	const handleClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (pending || disabled) return;
		if (isLoaded && !user) {
			window.location.href = "/sign-in";
			return;
		}
		setPending(true);
		try {
			await onToggle();
		} finally {
			setPending(false);
		}
	};

	const dims =
		size === "lg"
			? "min-w-[64px] gap-1 py-3 px-2 text-sm"
			: "min-w-[44px] gap-0.5 py-1.5 px-1.5 text-xs";

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled || pending}
			aria-pressed={voted}
			className={cn(
				"flex flex-col items-center rounded-button border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
				dims,
				voted
					? "border-accent/50 bg-accent/10 text-accent"
					: "border-border bg-card text-text-secondary hover:border-border-hover hover:text-text-primary",
			)}
		>
			<ArrowBigUp
				className={cn(size === "lg" ? "size-5" : "size-4")}
				strokeWidth={voted ? 2.5 : 2}
				aria-hidden
			/>
			<span
				className={cn(
					"font-mono tabular-nums font-medium",
					size === "lg" ? "text-base" : "text-[12px]",
				)}
			>
				{count}
			</span>
		</button>
	);
}
