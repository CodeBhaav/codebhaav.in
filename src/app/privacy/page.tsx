"use client";

import { motion } from "motion/react";
import { PageHeader } from "@/components/core/page-header";

export default function PrivacyPage() {
	const effectiveDate = "May 2, 2025";

	return (
		<>
			<PageHeader
				title="Privacy Policy"
				description="We value your privacy. Learn how we collect and protect your information."
				pattern="dots"
			/>

			<div className="container px-4 py-12">
				<div className="max-w-3xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="space-y-8"
					>
						<div className="flex items-center space-x-4">
							<div className="h-10 w-1 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full" />
							<p className="text-muted-foreground">
								Effective Date: {effectiveDate}
							</p>
						</div>

						<div className="prose prose-invert max-w-none">
							<p className="text-lg text-muted-foreground">
								CodeBhaav respects your privacy. We collect limited personal
								information such as name, email, and optional social handles
								strictly for community engagement, waitlist management, and
								updates.
							</p>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="mt-8 space-y-6"
							>
								<Section title="What We Collect">
									<ul className="list-disc pl-5 space-y-2">
										<li>
											Name and email (for identification and communication)
										</li>
										<li>
											Role, interests, and social handles (optional, for
											personalization)
										</li>
										<li>Referral info (to manage waitlist position)</li>
									</ul>
								</Section>

								<Section title="How We Use It">
									<ul className="list-disc pl-5 space-y-2">
										<li>Manage community waitlists</li>
										<li>Send occasional updates or invites</li>
										<li>Improve the platform experience</li>
									</ul>
								</Section>

								<Section title="We Do NOT">
									<ul className="list-disc pl-5 space-y-2">
										<li>Sell your data</li>
										<li>Spam you</li>
										<li>Track you unnecessarily</li>
									</ul>
								</Section>

								<Section title="Data Security">
									<p>
										We use modern encryption and best practices to protect your
										data.
									</p>
								</Section>

								<Section title="Contact">
									<p>
										For any questions or data deletion requests, email:{" "}
										<a
											href="mailto:pranav@codebhaav.in"
											className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
										>
											pranav@codebhaav.in
										</a>
									</p>
								</Section>
							</motion.div>
						</div>
					</motion.div>
				</div>
			</div>
		</>
	);
}

function Section({
	title,
	children,
}: { title: string; children: React.ReactNode }) {
	return (
		<div className="border border-primary/10 rounded-lg p-6 bg-black/20 backdrop-blur-sm">
			<h2 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
				{title}
			</h2>
			<div className="text-muted-foreground">{children}</div>
		</div>
	);
}
