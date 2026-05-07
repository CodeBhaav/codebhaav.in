import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface KineticTextProps {
	text: string;
	className?: string;
	delay?: number;
	stagger?: number;
	as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function KineticText({
	text,
	className,
	delay = 0,
	stagger = 0.06,
	as: Tag = "h2",
}: KineticTextProps) {
	const ref = useRef<HTMLElement | null>(null);
	const inView = useInView(ref, { once: true, margin: "-15%" });
	const words = text.trim().length > 0 ? text.trim().split(/\s+/) : [];

	return (
		<Tag
			ref={ref as React.RefObject<HTMLHeadingElement>}
			className={cn("inline-block", className)}
			aria-label={text}
		>
			{words.map((word, i) => (
				<motion.span
					// biome-ignore lint/suspicious/noArrayIndexKey: stable ordered words
					key={`${word}-${i}`}
					aria-hidden
					className="inline-block whitespace-pre"
					initial={{ y: "0.5em", opacity: 0, filter: "blur(8px)" }}
					animate={
						inView
							? { y: 0, opacity: 1, filter: "blur(0px)" }
							: { y: "0.5em", opacity: 0, filter: "blur(8px)" }
					}
					transition={{
						duration: 0.7,
						delay: delay + i * stagger,
						ease: [0.16, 1, 0.3, 1],
					}}
				>
					{word}
					{i < words.length - 1 ? " " : ""}
				</motion.span>
			))}
		</Tag>
	);
}
