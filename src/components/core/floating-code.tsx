"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FloatingCodeProps {
	code: string;
	language?: string;
	position?:
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "center-left"
		| "center-right";
	rotation?: number;
	width?: string;
	delay?: number;
	responsive?: boolean;
}

export function FloatingCode({
	code,
	language = "javascript",
	position = "top-right",
	rotation = 5,
	width = "w-72",
	delay = 0,
	responsive = true,
}: FloatingCodeProps) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
	const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

	// Define position classes
	const positions = {
		"top-left": "top-1/4 left-[15%]",
		"top-right": "top-1/4 right-[15%]",
		"bottom-left": "bottom-1/4 left-[15%]",
		"bottom-right": "bottom-1/4 right-[15%]",
		"center-left": "top-1/2 left-[15%] -translate-y-1/2",
		"center-right": "top-1/2 right-[15%] -translate-y-1/2",
	};

	// Define motion ranges based on position
	const getXRange = () => {
		switch (position) {
			case "top-left":
			case "bottom-left":
			case "center-left":
				return [5, -5];
			case "top-right":
			case "bottom-right":
			case "center-right":
				return [-5, 5];
			default:
				return [-10, 10];
		}
	};

	const xRange = getXRange();

	// Use useTransform instead of .to()
	const x = useTransform(smoothMouseX, [-1, 1], xRange);
	const y = useTransform(smoothMouseY, [-1, 1], [-10, 10]);
	const rotate = useTransform(
		smoothMouseX,
		[-1, 1],
		[rotation - 2, rotation + 2],
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const { clientX, clientY } = e;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// Calculate mouse position as percentage of window
			const x = (clientX / windowWidth - 0.5) * 2; // -1 to 1
			const y = (clientY / windowHeight - 0.5) * 2; // -1 to 1

			mouseX.set(x);
			mouseY.set(y);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [mouseX, mouseY]);

	return (
		<motion.div
			className={`absolute ${positions[position]} ${width} rounded-lg border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm shadow-lg ${
				responsive ? "hidden lg:block" : ""
			} overflow-hidden`}
			initial={{ opacity: 0, y: 20, rotate: rotation }}
			animate={{ opacity: 0.9, y: 0, rotate: rotation }}
			transition={{
				duration: 0.8,
				delay,
				type: "spring",
				stiffness: 100,
				damping: 15,
			}}
			style={{ x, y, rotate }}
			whileHover={{
				scale: 1.05,
				boxShadow:
					"0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
				transition: { duration: 0.2 },
			}}
		>
			<SyntaxHighlighter
				language={language}
				style={atomDark}
				customStyle={{
					margin: 0,
					padding: "1rem",
					background: "transparent",
					fontSize: "0.75rem",
					maxHeight: "150px",
					overflowY: "auto",
				}}
			>
				{code}
			</SyntaxHighlighter>
		</motion.div>
	);
}
