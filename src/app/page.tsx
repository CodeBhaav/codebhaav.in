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
		</div>
	);
}
