import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
	checked: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
	({ checked, onCheckedChange, disabled, className, ...rest }, ref) => {
		return (
			<button
				ref={ref}
				type="button"
				role="checkbox"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => {
					if (disabled) return;
					onCheckedChange?.(!checked);
				}}
				className={cn(
					"flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					"disabled:cursor-not-allowed disabled:opacity-50",
					checked
						? "border-accent bg-accent text-[#1a1208]"
						: "border-border bg-background hover:border-border-hover",
					className,
				)}
				{...rest}
			>
				{checked && <Check className="size-3" strokeWidth={3} aria-hidden />}
			</button>
		);
	},
);
Checkbox.displayName = "Checkbox";
