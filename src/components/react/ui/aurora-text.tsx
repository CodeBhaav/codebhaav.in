import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraTextProps {
	children: ReactNode;
	className?: string;
	colors?: string[];
	speed?: number;
}

export function AuroraText({
	children,
	className,
	colors = ["#FCD34D", "#FBBF24", "#F59E0B", "#F97316", "#EA580C"],
	speed = 1,
}: AuroraTextProps) {
	const gradientStyle: CSSProperties = {
		backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
		WebkitBackgroundClip: "text",
		WebkitTextFillColor: "transparent",
		backgroundSize: "300% 100%",
		animationDuration: `${10 / speed}s`,
	};

	return (
		<span className={cn("relative inline-block", className)}>
			<span className="sr-only">{children}</span>
			<span
				aria-hidden
				className="relative animate-aurora bg-clip-text text-transparent"
				style={gradientStyle}
			>
				{children}
			</span>
		</span>
	);
}
