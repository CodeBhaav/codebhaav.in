"use client";

import { motion } from "motion/react";
import { PageHeader } from "@/components/core/page-header";

export default function TermsPage() {
	const effectiveDate = "May 2, 2025";

	return (
		<>
			<PageHeader
				title="Terms of Service"
				description="Please read our terms and conditions for using the CodeBhaav platform."
				pattern="grid"
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
								By using CodeBhaav, you agree to the following:
							</p>

							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="mt-8 space-y-6"
							>
								<Section title="Purpose">
									<p>
										CodeBhaav is a developer community focused on learning,
										sharing, and collaboration.
									</p>
								</Section>

								<Section title="Content Ownership">
									<p>
										You retain rights to content you submit but allow us to use
										it within the platform (e.g., for displaying on community
										pages).
									</p>
								</Section>

								<Section title="Community Guidelines">
									<ul className="list-disc pl-5 space-y-2">
										<li>Be respectful</li>
										<li>No spam or harassment</li>
										<li>Keep it authentic</li>
									</ul>
								</Section>

								<Section title="Termination">
									<p>
										We reserve the right to remove access for violations of
										these terms.
									</p>
								</Section>

								<Section title="Liability">
									<p>
										CodeBhaav is provided "as is." We are not liable for any
										losses or damages resulting from your use of the platform.
									</p>
								</Section>

								<Section title="Contact">
									<p>
										For questions or disputes, email:{" "}
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
