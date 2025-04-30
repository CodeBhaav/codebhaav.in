"use client";

import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { Button } from "@/components/ui/button";
import { Code2, Lightbulb, Rocket, Users } from "lucide-react";
import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export function AboutSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	return (
		<section
			id="about"
			ref={ref}
			className="relative min-h-screen flex items-center py-16 md:py-24 bg-background overflow-hidden"
		>
			{/* Background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-[30%] -right-[10%] w-[50%] h-[70%] bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
				<div className="absolute -bottom-[30%] -left-[10%] w-[50%] h-[70%] bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
			</div>

			<div className="container px-4 relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
					transition={{ duration: 0.8 }}
					className="max-w-3xl mx-auto text-center mb-16"
				>
					<h2 className="text-3xl md:text-4xl font-bold mb-6">
						About CodeBhaav
					</h2>
					<p className="text-lg text-muted-foreground">
						A community built on authenticity, real-world problem solving, and
						making tech accessible to everyone.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="relative"
					>
						<div className="relative aspect-square overflow-hidden rounded-2xl">
							<Image
								src="/about.jpg?height=800&width=800"
								alt="CodeBhaav Community"
								fill
								className="object-cover "
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

							<div className="absolute inset-0 flex flex-col justify-end p-8">
								<h3 className="text-2xl font-bold mb-2">
									Self-taught Developer Building with Purpose
								</h3>
								<p className="text-muted-foreground mb-4">
									I&apos;m from Amravati – a tier-3 city where dreams don&apos;t
									come with user manuals. Started as an office boy, got into
									tech because I knew how to handle a computer. No IIT tag, no
									course certificate – just jugad, YouTube, and midnight
									debugging.
								</p>
								<HideAssistantOnHover>
									<Link href="/mission">
										<Button
											variant="outline"
											className="w-fit border-primary/20 backdrop-blur-sm bg-background/30"
										>
											Read My Story
										</Button>
									</Link>
								</HideAssistantOnHover>
							</div>
						</div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.5, delay: 0.5 }}
							className="absolute -bottom-6 -right-6 bg-primary/10 backdrop-blur-md rounded-lg p-4 border border-primary/20 hidden md:block"
						>
							<p className="text-sm font-medium">Building a community of</p>
							<p className="text-2xl font-bold">Purpose-driven Developers</p>
						</motion.div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 50 }}
						animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className="grid grid-cols-1 md:grid-cols-2 gap-4"
					>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.5, delay: 0.6 }}
							className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
							<div className="relative z-10">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-3">
									<Lightbulb className="w-5 h-5 text-primary" />
								</div>
								<h3 className="text-lg font-bold mb-2">Our Vision</h3>
								<p className="text-sm text-muted-foreground">
									To create a space where self-taught developers can learn,
									build, and grow without the barriers of traditional tech
									communities.
								</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.5, delay: 0.7 }}
							className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
							<div className="relative z-10">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-3">
									<Code2 className="w-5 h-5 text-primary" />
								</div>
								<h3 className="text-lg font-bold mb-2">Our Approach</h3>
								<p className="text-sm text-muted-foreground">
									No fake guru energy. No overpriced fluff. Just open-source
									tools, honest learning, and a place where every contributor
									counts.
								</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.5, delay: 0.8 }}
							className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
							<div className="relative z-10">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-3">
									<Users className="w-5 h-5 text-primary" />
								</div>
								<h3 className="text-lg font-bold mb-2">Who It&apos;s For</h3>
								<p className="text-sm text-muted-foreground">
									Whether you&apos;re writing your first line of code or
									launching your fifth side project — CodeBhaav is for you.
								</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
							transition={{ duration: 0.5, delay: 0.9 }}
							className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
						>
							<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
							<div className="relative z-10">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-3">
									<Rocket className="w-5 h-5 text-primary" />
								</div>
								<h3 className="text-lg font-bold mb-2">The Future</h3>
								<p className="text-sm text-muted-foreground">
									We&apos;re just getting started. Our goal is to build a
									community that creates real impact through projects,
									mentorship, and collaboration.
								</p>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
