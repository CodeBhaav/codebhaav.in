import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type VoteDirection = "up" | "down";

interface Props {
	upvotes: number;
	downvotes: number;
	myVote: VoteDirection | null;
	onVote: (direction: VoteDirection) => Promise<void>;
	size?: "sm" | "lg";
	disabled?: boolean;
}

export function VoteButton({
	upvotes,
	downvotes,
	myVote,
	onVote,
	size = "sm",
	disabled,
}: Props) {
	const { user, isLoaded } = useUser();
	const [pending, setPending] = useState<VoteDirection | null>(null);
	const score = upvotes - downvotes;

	const handle = async (direction: VoteDirection, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (pending || disabled) return;
		if (isLoaded && !user) {
			window.location.href = "/sign-in";
			return;
		}
		setPending(direction);
		try {
			await onVote(direction);
		} finally {
			setPending(null);
		}
	};

	const small = size === "sm";
	const iconClass = small ? "size-4" : "size-5";
	const wrapClass = small
		? "min-w-[44px] py-1.5 px-1.5 gap-0.5"
		: "min-w-[56px] py-2 px-1.5 gap-1";

	return (
		<div
			className={cn(
				"flex flex-col items-center rounded-button border bg-card",
				wrapClass,
				myVote === "up"
					? "border-accent/40"
					: myVote === "down"
						? "border-rose-500/40"
						: "border-border",
			)}
		>
			<button
				type="button"
				onClick={(e) => handle("up", e)}
				disabled={disabled || pending !== null}
				aria-pressed={myVote === "up"}
				aria-label="Upvote"
				className={cn(
					"inline-flex items-center justify-center rounded-[4px] p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
					myVote === "up"
						? "text-accent"
						: "text-text-muted hover:text-text-primary",
				)}
			>
				<ArrowBigUp
					className={iconClass}
					strokeWidth={myVote === "up" ? 2.5 : 2}
					fill={myVote === "up" ? "currentColor" : "none"}
					aria-hidden
				/>
			</button>
			<span
				className={cn(
					"font-mono tabular-nums font-medium",
					small ? "text-[12px]" : "text-sm",
					score > 0
						? "text-text-primary"
						: score < 0
							? "text-rose-300"
							: "text-text-muted",
				)}
				title={`${upvotes} up · ${downvotes} down`}
			>
				{score}
			</span>
			<button
				type="button"
				onClick={(e) => handle("down", e)}
				disabled={disabled || pending !== null}
				aria-pressed={myVote === "down"}
				aria-label="Downvote"
				className={cn(
					"inline-flex items-center justify-center rounded-[4px] p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
					myVote === "down"
						? "text-rose-300"
						: "text-text-muted hover:text-text-primary",
				)}
			>
				<ArrowBigDown
					className={iconClass}
					strokeWidth={myVote === "down" ? 2.5 : 2}
					fill={myVote === "down" ? "currentColor" : "none"}
					aria-hidden
				/>
			</button>
		</div>
	);
}
