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
import prisma from "@/lib/prisma";

export default function Home() {
	return (
		<AssistantBotProvider>
			<LandingPage />
		</AssistantBotProvider>
	);
}
export const dynamic = "force-dynamic"; // Force dynamic rendering to always show the latest waitlist count
export const revalidate = 0; // Disable revalidation for this page

async function LandingPage() {
	const waitlistCount = await prisma.waitlist.count();
	return (
		<div className="relative min-h-screen overflow-hidden">
			<SmoothCursor />

			{/* Hero Section - Using the new HeroV2 component */}
			<HeroV2 waitlistCount={waitlistCount} />

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
