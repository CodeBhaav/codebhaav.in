"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAssistantBot } from "../providers/assistant-bot-context";

export function SmoothCursor() {
	const [isHovered, setIsHovered] = useState(false);
	const { theme } = useTheme();
	const { scale } = useAssistantBot();

	// Mouse position values with spring physics
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	// Apply spring physics for smooth movement
	const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
	const smoothX = useSpring(mouseX, springConfig);
	const smoothY = useSpring(mouseY, springConfig);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			// Update the motion values with current mouse position
			// Subtract half the cursor size to center it on the mouse
			mouseX.set(e.clientX - 5);
			mouseY.set(e.clientY - 5);
		};

		window.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
		};
	}, [mouseX, mouseY]);

	return (
		<motion.div
			className="fixed z-[9999] pointer-events-none hidden md:block"
			style={{
				left: smoothX,
				top: smoothY,
			}}
			initial={{ scale: 0, opacity: 0 }}
			animate={{
				scale: scale,
				opacity: scale,
			}}
			transition={{
				scale: { type: "spring", stiffness: 300, damping: 20 },
				opacity: { duration: 0.2 },
			}}
		>
			<motion.div
				className="size-2 rounded-full flex items-center justify-center"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				animate={{
					scale: isHovered ? 1.2 : 1,
					backgroundColor: isHovered
						? theme === "dark"
							? "rgba(13, 148, 136, 0.3)"
							: "rgba(20, 184, 166, 0.3)"
						: "rgba(0, 0, 0, 0)",
				}}
				transition={{ duration: 0.2 }}
			>
				<motion.div
					className="size-2 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500"
					animate={{
						scale: [1, 1.1, 1],
						rotate: [0, 5, -5, 0],
					}}
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: "reverse",
					}}
				/>
			</motion.div>
		</motion.div>
	);
}
