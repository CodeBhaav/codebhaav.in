import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OrbitingCirclesProps {
	className?: string;
	children?: ReactNode;
	reverse?: boolean;
	duration?: number;
	delay?: number;
	radius?: number;
	path?: boolean;
	iconSize?: number;
	speed?: number;
}

export function OrbitingCircles({
	className,
	children,
	reverse = false,
	duration = 20,
	radius = 160,
	path = true,
	iconSize = 30,
	speed = 1,
	...props
}: OrbitingCirclesProps) {
	const calculatedDuration = duration / speed;
	const items = Array.isArray(children) ? children : [children];

	return (
		<>
			{path && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					version="1.1"
					className="pointer-events-none absolute inset-0 size-full"
					aria-hidden
				>
					<title>orbit path</title>
					<circle
						className="stroke-border/40 stroke-1 dark:stroke-border/40"
						cx="50%"
						cy="50%"
						r={radius}
						fill="none"
						strokeDasharray="2 6"
					/>
				</svg>
			)}

			{items.map((child, index) => {
				const angle = (360 / items.length) * index;
				return (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: stable orbit slots
						key={`orbit-${index}`}
						style={
							{
								"--duration": `${calculatedDuration}s`,
								"--radius": radius,
								"--angle": angle,
								"--icon-size": `${iconSize}px`,
							} as CSSProperties
						}
						className={cn(
							"absolute left-1/2 top-1/2 flex transform-gpu items-center justify-center",
							"min-h-[var(--icon-size)] min-w-[var(--icon-size)]",
							"animate-orbit",
							{ "[animation-direction:reverse]": reverse },
							className,
						)}
						{...props}
					>
						{child}
					</div>
				);
			})}
		</>
	);
}
