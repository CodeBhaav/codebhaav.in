import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
	checked: boolean;
	onCheckedChange?: (checked: boolean) => void;
	size?: "sm" | "md";
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
	(
		{
			checked,
			onCheckedChange,
			size = "md",
			disabled,
			className,
			...rest
		},
		ref,
	) => {
		const dims =
			size === "sm"
				? { track: "h-5 w-9", thumb: "size-4", translate: "translate-x-4" }
				: { track: "h-6 w-11", thumb: "size-5", translate: "translate-x-5" };

		return (
			<button
				ref={ref}
				type="button"
				role="switch"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => {
					if (disabled) return;
					onCheckedChange?.(!checked);
				}}
				data-state={checked ? "checked" : "unchecked"}
				className={cn(
					"relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-out",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					"disabled:cursor-not-allowed disabled:opacity-50",
					dims.track,
					checked ? "bg-accent" : "bg-surface border-border",
					className,
				)}
				{...rest}
			>
				<span
					aria-hidden
					className={cn(
						"pointer-events-none inline-block translate-x-0.5 rounded-full shadow-sm transition-transform duration-200 ease-out",
						dims.thumb,
						checked
							? `${dims.translate} bg-[#1a1208]`
							: "bg-text-muted",
					)}
				/>
			</button>
		);
	},
);
Switch.displayName = "Switch";
