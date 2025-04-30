"use client";

import { SmoothCursor } from "@/components/core/smooth-cursor";
import { AboutSection } from "@/components/landing/about-section";
import { FounderSection } from "@/components/landing/founder-section";
// import { MentorshipSection } from "@/components/mentorship-section"
// import { JoinSection } from "@/components/join-section"
// import { FeaturedReviews } from "@/components/featured-reviews"
import { HeroV2 } from "@/components/landing/hero";
import { TeamSection } from "@/components/landing/team-section";
// import { ProjectCard } from "@/components/project-card"
import { AssistantBotProvider } from "@/components/providers/assistant-bot-context";
import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<AssistantBotProvider>
			<LandingPage />
		</AssistantBotProvider>
	);
}

function LandingPage() {
	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* <MagneticCursor /> */}
			<SmoothCursor />

			{/* Hero Section - Using the new HeroV2 component */}
			<HeroV2 />

			{/* About Us Section */}
			<AboutSection />

			{/* Founder Section */}
			<section id="founder" className="relative min-h-screen">
				<FounderSection />
			</section>

			{/* Team Section */}
			<section id="team" className="relative min-h-screen">
				<TeamSection />
			</section>

			{/* Footer */}
			<footer className="relative py-12 md:py-16 bg-zinc-950 border-t border-zinc-800">
				<div className="container px-4">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="md:col-span-2">
							<div className="flex items-center gap-2 mb-4">
								<Image
									src="/logo.svg"
									alt="CodeBhaav Logo"
									className="rounded-full"
									width={38}
									height={38}
								/>
								<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
									CodeBhaav
								</span>
							</div>
							<p className="text-zinc-400 mb-6 max-w-md">
								A student-led tech community from Amravati, fostering
								innovation, collaboration, and purpose-driven development.
							</p>
							<div className="flex gap-4">
								<HideAssistantOnHover>
									<motion.a
										href="https://github.com/codebhaav"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ y: -5, scale: 1.1 }}
										transition={{ type: "spring", stiffness: 400, damping: 10 }}
										className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700"
									>
										<Github className="h-5 w-5" />
									</motion.a>
								</HideAssistantOnHover>

								<HideAssistantOnHover>
									<motion.a
										// biome-ignore lint/a11y/useValidAnchor: <explanation>
										href="#"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ y: -5, scale: 1.1 }}
										transition={{ type: "spring", stiffness: 400, damping: 10 }}
										className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700"
									>
										<Twitter className="h-5 w-5" />
									</motion.a>
								</HideAssistantOnHover>

								<HideAssistantOnHover>
									<motion.a
										// biome-ignore lint/a11y/useValidAnchor: <explanation>
										href="#"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ y: -5, scale: 1.1 }}
										transition={{ type: "spring", stiffness: 400, damping: 10 }}
										className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700"
									>
										<Instagram className="h-5 w-5" />
									</motion.a>
								</HideAssistantOnHover>

								<HideAssistantOnHover>
									<motion.a
										// biome-ignore lint/a11y/useValidAnchor: <explanation>
										href="#"
										target="_blank"
										rel="noopener noreferrer"
										whileHover={{ y: -5, scale: 1.1 }}
										transition={{ type: "spring", stiffness: 400, damping: 10 }}
										className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700"
									>
										<Linkedin className="h-5 w-5" />
									</motion.a>
								</HideAssistantOnHover>
							</div>
						</div>

						<div>
							<h3 className="text-lg font-semibold mb-4">Quick Links</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="#about"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										About Us
									</Link>
								</li>
								<li>
									<Link
										href="#founder"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Founder
									</Link>
								</li>
								<li>
									<Link
										href="#team"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Team
									</Link>
								</li>
								<li>
									<Link
										href="#projects"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Projects
									</Link>
								</li>
								<li>
									<Link
										href="#reviews"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Reviews
									</Link>
								</li>
								<li>
									<Link
										href="#mentorship"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Mentorship
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-lg font-semibold mb-4">Resources</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/mission"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Our Mission
									</Link>
								</li>
								<li>
									<Link
										href="/blog"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Blog
									</Link>
								</li>
								<li>
									<Link
										href="/projects"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Projects
									</Link>
								</li>
								<li>
									<Link
										href="/reviews"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Reviews
									</Link>
								</li>
								<li>
									<Link
										href="/waitlist"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Join Waitlist
									</Link>
								</li>
								<li>
									<Link
										href="/founding-member"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Become a Founder
									</Link>
								</li>
								<li>
									<Link
										href="/support"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Support Us
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										className="text-zinc-400 hover:text-cyan-400 transition-colors"
									>
										Contact Us
									</Link>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-12 pt-6 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
						<p className="text-sm text-zinc-500">
							&copy; {new Date().getFullYear()} CodeBhaav. All rights reserved.
						</p>
						<div className="flex gap-4 mt-4 md:mt-0">
							<Link
								href="/terms"
								className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors"
							>
								Terms
							</Link>
							<Link
								href="/privacy"
								className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors"
							>
								Privacy
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
