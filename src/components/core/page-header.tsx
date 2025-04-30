"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { HideAssistantOnHover } from "../providers/hide-assistant-on-hover";
import { Button } from "../ui/button";

interface PageHeaderProps {
	title: string;
	description?: string;
	ctaText?: string;
	ctaLink?: string;
	secondaryCtaText?: string;
	secondaryCtaLink?: string;
	pattern?: "dots" | "grid" | "waves" | "none";
	align?: "center" | "left";
	size?: "default" | "large" | "small";
	showPattern?: boolean;
}

export function PageHeader({
	title,
	description,
	ctaText,
	ctaLink,
	secondaryCtaText,
	secondaryCtaLink,
	pattern = "dots",
	align = "center",
	size = "default",
	showPattern = true,
}: PageHeaderProps) {
	const patterns = {
		dots: "/patterns/dots.svg",
		grid: "/patterns/grid.svg",
		waves: "/patterns/waves.svg",
		none: "",
	};

	const titleSizes = {
		default: "text-4xl md:text-5xl",
		large: "text-5xl md:text-6xl",
		small: "text-3xl md:text-4xl",
	};

	const descriptionSizes = {
		default: "text-lg",
		large: "text-xl",
		small: "text-base",
	};

	const paddingSizes = {
		default: "py-16 md:py-24",
		large: "py-20 md:py-32",
		small: "py-12 md:py-16",
	};

	return (
		<div className={`relative ${paddingSizes[size]} overflow-hidden`}>
			{/* Background elements */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 z-0" />

			{showPattern && pattern !== "none" && (
				<div className="absolute inset-0 opacity-10 z-0">
					<Image
						src={patterns[pattern] || "/placeholder.svg"}
						alt=""
						fill
						className="object-cover"
					/>
				</div>
			)}

			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

			<div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
			<div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

			<div className="container relative z-10 px-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className={`max-w-3xl mx-auto ${align === "center" ? "text-center" : "text-left"}`}
				>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className={`font-bold mb-6 ${titleSizes[size]} bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary`}
					>
						{title}
					</motion.h1>

					{description && (
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className={`${descriptionSizes[size]} text-muted-foreground mb-8 max-w-2xl ${
								align === "center" ? "mx-auto" : ""
							}`}
						>
							{description}
						</motion.p>
					)}

					{(ctaText || secondaryCtaText) && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
							className={`flex flex-wrap gap-4 ${align === "center" ? "justify-center" : "justify-start"}`}
						>
							{ctaText && ctaLink && (
								<HideAssistantOnHover>
									<Link href={ctaLink}>
										<Button
											size={size === "small" ? "default" : "lg"}
											className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 group"
										>
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
											size={size === "small" ? "default" : "lg"}
											variant="outline"
											className="border-primary/20 backdrop-blur-sm bg-background/30"
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
