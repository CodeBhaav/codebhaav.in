"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { HideAssistantOnHover } from "../providers/hide-assistant-on-hover";
import { Button } from "../ui/button";
import { FloatingCode } from "./floating-code";

interface PageHeaderMinimalProps {
	title: string;
	description?: string;
	ctaText?: string;
	ctaLink?: string;
	secondaryCtaText?: string;
	secondaryCtaLink?: string;
	align?: "center" | "left";
	variant?: "default" | "gradient" | "subtle" | "dark";
	titleColor?: "default" | "gradient" | "accent" | "muted";
	codeSnippet?: string;
	codeLanguage?: string;
	size?: "default" | "large" | "small";
	codePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function PageHeaderMinimal({
	title,
	description,
	ctaText,
	ctaLink,
	secondaryCtaText,
	secondaryCtaLink,
	align = "center",
	variant = "default",
	titleColor = "default",
	codeSnippet,
	size = "default",
	codeLanguage = "javascript",
	codePosition = "top-right",
}: PageHeaderMinimalProps) {
	// Define background styles based on variant
	const backgrounds = {
		default: "bg-zinc-900",
		gradient: "bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950",
		subtle: "bg-zinc-900/50",
		dark: "bg-zinc-950",
	};

	// Define title color styles
	const titleColors = {
		default: "text-white",
		gradient:
			"bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500",
		accent: "text-cyan-400",
		muted: "text-zinc-300",
	};
	const paddingSizes = {
		default: "py-16 md:py-24",
		large: "py-20 md:py-32",
		small: "py-12 md:py-16",
	};

	const defaultCodeSnippet = `// CodeBhaav Community
import { learn, build, share } from 'codebhaav';

const journey = async () => {
  await learn();
  build();
  share();
};`;

	return (
		<div
			className={`relative ${paddingSizes[size]} ${backgrounds[variant]} overflow-hidden`}
		>
			{/* Background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 blur-3xl" />
			</div>

			{/* Floating code snippet */}
			{codeSnippet && (
				<FloatingCode
					code={codeSnippet}
					language={codeLanguage}
					position={codePosition}
					delay={0.5}
					width="w-max"
				/>
			)}

			{/* If no code snippet is provided but we still want to show one */}
			{!codeSnippet && variant === "gradient" && (
				<FloatingCode
					width="w-max"
					code={defaultCodeSnippet}
					language="javascript"
					position={codePosition}
					delay={0.5}
				/>
			)}

			<div className="container px-4 relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className={`max-w-3xl mx-auto ${align === "center" ? "text-center" : "text-left"}`}
				>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className={`text-4xl md:text-5xl font-bold mb-6 ${titleColors[titleColor]}`}
					>
						{title}
					</motion.h1>

					{description && (
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto"
						>
							{description}
						</motion.p>
					)}

					{(ctaText || secondaryCtaText) && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className={`flex flex-wrap gap-4 ${align === "center" ? "justify-center" : "justify-start"}`}
						>
							{ctaText && ctaLink && (
								<HideAssistantOnHover>
									<Link href={ctaLink}>
										<Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 group">
											{ctaText}
											<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Button>
									</Link>
								</HideAssistantOnHover>
							)}

							{secondaryCtaText && secondaryCtaLink && (
								<HideAssistantOnHover>
									<Link href={secondaryCtaLink}>
										<Button
											variant="outline"
											className="border-zinc-700 bg-zinc-800/50"
										>
											{secondaryCtaText}
										</Button>
									</Link>
								</HideAssistantOnHover>
							)}
						</motion.div>
					)}
				</motion.div>
			</div>
		</div>
	);
}
