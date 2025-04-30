"use client";

import { PageHeaderMinimal } from "@/components/core/page-header-minimal";
import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { Button } from "@/components/ui/button";
import { Code2, Lightbulb, Rocket, Users } from "lucide-react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

export default function MissionPage() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	const missionCodeSnippet = `// Our Mission
function buildCommunity() {
  const values = {
    authenticity: true,
    practicalLearning: true,
    inclusivity: true,
    openSource: true
  };
  
  return createImpact(values);
}`;

	const valuesCodeSnippet = `// Core Values
const codeBhaav = {
  authenticity: "No fake guru energy",
  practicalLearning: "Learn by building",
  inclusivity: "Everyone belongs here",
  openSource: "Building in the open"
};`;

	return (
		<div className="min-h-screen bg-zinc-900">
			<PageHeaderMinimal
				title="Our Mission"
				description="Building something raw, real, and valuable for self-taught developers."
				ctaText="Join Our Mission"
				ctaLink="/waitlist"
				secondaryCtaText="Learn More"
				secondaryCtaLink="#mission-details"
				variant="gradient"
				titleColor="gradient"
				size="large"
				codeSnippet={missionCodeSnippet}
			/>

			<div className="container px-4 py-16 md:py-24" id="mission-details">
				<div className="max-w-4xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="space-y-16"
					>
						<section className="relative overflow-hidden rounded-2xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-8 md:p-12">
							<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 z-0" />
							<div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />
							<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

							<div className="relative z-10">
								<h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
									<span className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
										<Lightbulb className="w-5 h-5 text-cyan-400" />
									</span>
									The Problem We're Solving
								</h2>
								<p className="text-zinc-400 mb-4 text-lg">
									Too many platforms out there focus on hype, aesthetics, or
									popularity — not actual value. For self-taught developers, the
									learning curve is steep, but the support is rare.
								</p>
								<p className="text-zinc-400 text-lg">
									Many tech communities cater to those with traditional
									backgrounds, leaving self-taught developers feeling like
									outsiders. We're changing that.
								</p>
							</div>
						</section>

						<section ref={ref} className="relative">
							<h2 className="text-2xl md:text-3xl font-bold mb-8">
								Core Values
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<motion.div
									initial={{ opacity: 0, y: 30 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
									}
									transition={{ duration: 0.6, delay: 0.1 }}
									className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-md hover:shadow-zinc-900/50 h-full"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 z-0" />
									<div className="relative z-10">
										<div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
											<Lightbulb className="w-6 h-6 text-cyan-400" />
										</div>
										<h3 className="text-xl font-bold mb-2">Authenticity</h3>
										<p className="text-zinc-400">
											No fake guru energy. No overpriced fluff. Just honest
											learning and real value. We embrace diverse backgrounds
											and journeys.
										</p>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 30 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
									}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-md hover:shadow-zinc-900/50 h-full"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 z-0" />
									<div className="relative z-10">
										<div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
											<Code2 className="w-6 h-6 text-purple-400" />
										</div>
										<h3 className="text-xl font-bold mb-2">
											Practical Learning
										</h3>
										<p className="text-zinc-400">
											We focus on building real-world projects and solving
											actual problems rather than theoretical knowledge alone.
											Learning by doing is our mantra.
										</p>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 30 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
									}
									transition={{ duration: 0.6, delay: 0.3 }}
									className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-md hover:shadow-zinc-900/50 h-full"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 z-0" />
									<div className="relative z-10">
										<div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
											<Users className="w-6 h-6 text-blue-400" />
										</div>
										<h3 className="text-xl font-bold mb-2">Inclusivity</h3>
										<p className="text-zinc-400">
											Everyone belongs here, especially those who feel they
											don't have the "perfect background." Your journey and
											perspective matter.
										</p>
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, y: 30 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
									}
									transition={{ duration: 0.6, delay: 0.4 }}
									className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-md hover:shadow-zinc-900/50 h-full"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 z-0" />
									<div className="relative z-10">
										<div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
											<Rocket className="w-6 h-6 text-cyan-400" />
										</div>
										<h3 className="text-xl font-bold mb-2">Open Source</h3>
										<p className="text-zinc-400">
											We believe in building in the open, sharing knowledge
											freely, and creating tools that are accessible to everyone
											regardless of their circumstances.
										</p>
									</div>
								</motion.div>
							</div>
						</section>

						<section className="relative overflow-hidden rounded-2xl backdrop-blur-sm bg-zinc-900/30 border border-zinc-800 p-8 md:p-12">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 z-0" />
							<div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
							<div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />

							<div className="relative z-10">
								<h2 className="text-2xl md:text-3xl font-bold mb-6">
									Our Approach
								</h2>
								<p className="text-zinc-400 mb-4 text-lg">
									CodeBhaav is starting small but with a clear vision. We're
									building a community where self-taught developers can find
									resources, mentorship, and opportunities that respect their
									unique journey.
								</p>
								<p className="text-zinc-400 mb-4 text-lg">
									We'll focus on creating practical tools, sharing honest
									experiences, and fostering connections between people who
									understand what it's like to learn tech without a traditional
									path.
								</p>
								<p className="text-zinc-400 text-lg">
									As we grow, our success won't be measured by numbers, but by
									the real impact we have on people's learning journeys and
									careers.
								</p>
							</div>
						</section>

						<section className="text-center">
							<h2 className="text-2xl md:text-3xl font-bold mb-6">
								Join Our Mission
							</h2>
							<p className="text-zinc-400 mb-6 text-lg max-w-3xl mx-auto">
								If you've ever felt like an outsider in tech, if you've learned
								from YouTube videos and Stack Overflow, if you've built projects
								on your phone or debugged through midnight — CodeBhaav is for
								you.
							</p>
							<p className="text-zinc-400 mb-8 text-lg max-w-3xl mx-auto">
								We're just getting started, and your voice can help shape what
								this community becomes.
							</p>
							<HideAssistantOnHover>
								<Link href="/founding-member">
									<Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8 py-6 text-lg h-auto">
										Become a Founding Member
									</Button>
								</Link>
							</HideAssistantOnHover>
						</section>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
