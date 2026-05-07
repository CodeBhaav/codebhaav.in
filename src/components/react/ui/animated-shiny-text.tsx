import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps {
	children: ReactNode;
	className?: string;
	shimmerWidth?: number;
}

export function AnimatedShinyText({
	children,
	className,
	shimmerWidth = 100,
}: AnimatedShinyTextProps) {
	return (
		<span
			style={{ "--shiny-width": `${shimmerWidth}px` } as CSSProperties}
			className={cn(
				"mx-auto max-w-md text-text-secondary/80",
				"animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%]",
				"bg-gradient-to-r from-transparent via-white/90 via-50% to-transparent",
				className,
			)}
		>
			{children}
		</span>
	);
}
