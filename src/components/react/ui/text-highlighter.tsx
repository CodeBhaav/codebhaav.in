import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextHighlighterProps {
	children: ReactNode;
	className?: string;
	highlightColor?: string;
	delay?: number;
	duration?: number;
}

export function TextHighlighter({
	children,
	className,
	highlightColor = "rgba(245, 158, 11, 0.85)",
	delay = 0,
	duration = 1200,
}: TextHighlighterProps) {
	const ref = useRef<HTMLSpanElement | null>(null);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setTimeout(() => setActive(true), delay);
						observer.disconnect();
					}
				}
			},
			{ threshold: 0.3 },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [delay]);

	return (
		<span
			ref={ref}
			className={cn(
				"relative inline font-medium transition-colors duration-500",
				active ? "text-[#0b0b0d]" : "text-text-secondary",
				className,
			)}
			style={{
				backgroundImage: `linear-gradient(120deg, ${highlightColor} 0%, ${highlightColor} 100%)`,
				backgroundRepeat: "no-repeat",
				backgroundSize: active ? "100% 100%" : "0% 100%",
				backgroundPosition: "0 0",
				borderRadius: "2px",
				padding: "1px 4px",
				margin: "0 -2px",
				boxDecorationBreak: "clone",
				WebkitBoxDecorationBreak: "clone",
				transition: `background-size ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), color 500ms ease ${Math.max(0, duration - 500)}ms`,
			}}
		>
			{children}
		</span>
	);
}
