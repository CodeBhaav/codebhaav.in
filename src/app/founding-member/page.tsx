"use client";

import type React from "react";

import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { PageHeader } from "@/components/core/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, useInView } from "motion/react";
import { CheckCircle2, Rocket, Shield, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { PageHeaderMinimal } from "@/components/core/page-header-minimal";

export default function FoundingMemberPage() {
	const [formState, setFormState] = useState({
		name: "",
		email: "",
		github: "",
		linkedin: "",
		portfolio: "",
		skills: "",
		experience: "",
		motivation: "",
		commitment: "",
		ideas: "",
	});

	const [isSubmitted, setIsSubmitted] = useState(false);
	const formRef = useRef(null);
	const isInView = useInView(formRef, { once: true, margin: "-100px" });

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormState((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Here you would send the form data to your backend
		console.log(formState);
		// Simulate submission
		setTimeout(() => {
			setIsSubmitted(true);
		}, 1000);
	};

	const benefits = [
		{
			icon: <Star className="w-5 h-5 text-primary" />,
			title: "Recognition",
			description:
				"Be recognized as a founding member in our community and on our website",
		},
		{
			icon: <Shield className="w-5 h-5 text-primary" />,
			title: "Decision Making",
			description:
				"Help shape the direction and focus of our growing community",
		},
		{
			icon: <Rocket className="w-5 h-5 text-primary" />,
			title: "Early Access",
			description:
				"Get first access to all resources, events, and opportunities",
		},
	];

	return (
		<div className="min-h-screen">
			<PageHeaderMinimal
				size="large"
				title="Become a Founding Member"
				description="Help shape the future of CodeBhaav from the beginning"
			/>

			<div className="container px-4 py-16 md:py-24">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
						<div className="lg:col-span-1">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8 }}
								className="sticky top-24"
							>
								<h2 className="text-2xl font-bold mb-6">
									Why Become a Founding Member?
								</h2>
								<p className="text-muted-foreground mb-8">
									As a founding member, you'll play a crucial role in shaping
									CodeBhaav's future. You'll be part of our origin story and
									help build something meaningful from the ground up.
								</p>

								<div className="space-y-6">
									{benefits.map((benefit, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
											className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5"
										>
											<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
											<div className="relative z-10 flex gap-4">
												<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
													{benefit.icon}
												</div>
												<div>
													<h3 className="text-lg font-bold mb-1">
														{benefit.title}
													</h3>
													<p className="text-sm text-muted-foreground">
														{benefit.description}
													</p>
												</div>
											</div>
										</motion.div>
									))}
								</div>

								<div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/10">
									<h3 className="text-lg font-bold mb-2">
										Looking for something else?
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										If you're interested in joining but not ready for a founding
										member role, you can join our waitlist instead.
									</p>
									<HideAssistantOnHover>
										<Link href="/waitlist">
											<Button
												variant="outline"
												className="w-full border-primary/20"
											>
												Join Waitlist Instead
											</Button>
										</Link>
									</HideAssistantOnHover>
								</div>
							</motion.div>
						</div>

						<div className="lg:col-span-2">
							{!isSubmitted ? (
								<motion.div
									ref={formRef}
									initial={{ opacity: 0, y: 20 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
									}
									transition={{ duration: 0.8 }}
									className="relative overflow-hidden rounded-2xl backdrop-blur-sm bg-background/30 border border-primary/10"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
									<div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
									<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

									<div className="relative z-10 p-8 md:p-12">
										<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
											<div>
												<h2 className="text-2xl md:text-3xl font-bold">
													Founding Member Application
												</h2>
												<p className="text-muted-foreground mt-1">
													Tell us about yourself and why you want to join
												</p>
											</div>
											<div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
												<Users className="w-4 h-4 text-primary" />
												<span className="text-sm font-medium">
													Limited spots available
												</span>
											</div>
										</div>

										<form onSubmit={handleSubmit} className="space-y-8">
											<div className="space-y-6">
												<h3 className="text-xl font-semibold">
													Personal Information
												</h3>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div className="space-y-2">
														<Label htmlFor="name" className="text-base">
															Full Name
														</Label>
														<Input
															id="name"
															name="name"
															placeholder="Your name"
															value={formState.name}
															onChange={handleChange}
															required
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor="email" className="text-base">
															Email Address
														</Label>
														<Input
															id="email"
															name="email"
															type="email"
															placeholder="you@example.com"
															value={formState.email}
															onChange={handleChange}
															required
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
													<div className="space-y-2">
														<Label htmlFor="github" className="text-base">
															GitHub Profile (optional)
														</Label>
														<Input
															id="github"
															name="github"
															placeholder="github.com/username"
															value={formState.github}
															onChange={handleChange}
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor="linkedin" className="text-base">
															LinkedIn Profile (optional)
														</Label>
														<Input
															id="linkedin"
															name="linkedin"
															placeholder="linkedin.com/in/username"
															value={formState.linkedin}
															onChange={handleChange}
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>

													<div className="space-y-2">
														<Label htmlFor="portfolio" className="text-base">
															Portfolio/Website (optional)
														</Label>
														<Input
															id="portfolio"
															name="portfolio"
															placeholder="yourwebsite.com"
															value={formState.portfolio}
															onChange={handleChange}
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>
												</div>
											</div>

											<div className="space-y-6">
												<h3 className="text-xl font-semibold">
													Skills & Experience
												</h3>

												<div className="space-y-2">
													<Label htmlFor="skills" className="text-base">
														What skills can you contribute to the community?
													</Label>
													<Textarea
														id="skills"
														name="skills"
														placeholder="E.g., web development, design, content creation, community building..."
														value={formState.skills}
														onChange={handleChange}
														required
														className="min-h-[100px] bg-background/50 border-primary/20 text-base"
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="experience" className="text-base">
														Briefly describe your relevant experience
													</Label>
													<Textarea
														id="experience"
														name="experience"
														placeholder="Tell us about your background, projects, or any community involvement..."
														value={formState.experience}
														onChange={handleChange}
														required
														className="min-h-[100px] bg-background/50 border-primary/20 text-base"
													/>
												</div>
											</div>

											<div className="space-y-6">
												<h3 className="text-xl font-semibold">
													Motivation & Commitment
												</h3>

												<div className="space-y-2">
													<Label htmlFor="motivation" className="text-base">
														Why do you want to be a founding member of
														CodeBhaav?
													</Label>
													<Textarea
														id="motivation"
														name="motivation"
														placeholder="What interests you about our mission and community?"
														value={formState.motivation}
														onChange={handleChange}
														required
														className="min-h-[100px] bg-background/50 border-primary/20 text-base"
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="commitment" className="text-base">
														How much time can you commit to the community each
														week?
													</Label>
													<Textarea
														id="commitment"
														name="commitment"
														placeholder="Be honest about your availability and how you'd like to contribute..."
														value={formState.commitment}
														onChange={handleChange}
														required
														className="min-h-[100px] bg-background/50 border-primary/20 text-base"
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="ideas" className="text-base">
														Do you have any ideas or suggestions for the
														community?
													</Label>
													<Textarea
														id="ideas"
														name="ideas"
														placeholder="Share any thoughts on what you'd like to see or help build..."
														value={formState.ideas}
														onChange={handleChange}
														className="min-h-[100px] bg-background/50 border-primary/20 text-base"
													/>
												</div>
											</div>

											<div className="pt-4">
												<p className="text-sm text-muted-foreground mb-6">
													By submitting this form, you agree to our{" "}
													<a
														href="/terms"
														className="text-primary hover:underline"
													>
														Terms of Service
													</a>{" "}
													and{" "}
													<a
														href="/privacy"
														className="text-primary hover:underline"
													>
														Privacy Policy
													</a>
													.
												</p>

												<HideAssistantOnHover>
													<Button
														type="submit"
														className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 w-full md:w-auto px-8"
													>
														Submit Application
													</Button>
												</HideAssistantOnHover>
											</div>
										</form>
									</div>
								</motion.div>
							) : (
								<motion.div
									initial={{ opacity: 0, scale: 0.95 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.5 }}
									className="relative overflow-hidden rounded-2xl backdrop-blur-sm bg-background/30 border border-primary/10 p-8 md:p-12 text-center"
								>
									<div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
									<div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
									<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

									<div className="relative z-10 py-8">
										<div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
											<CheckCircle2 className="w-10 h-10 text-primary" />
										</div>

										<h2 className="text-2xl md:text-3xl font-bold mb-4">
											Application Received!
										</h2>
										<p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
											Thank you for applying to be a founding member of
											CodeBhaav. We'll review your application and get back to
											you soon.
										</p>

										<div className="flex flex-col sm:flex-row gap-4 justify-center">
											<HideAssistantOnHover>
												<Button
													onClick={() => (window.location.href = "/")}
													variant="outline"
													className="border-primary/20"
												>
													Return to Home
												</Button>
											</HideAssistantOnHover>

											<HideAssistantOnHover>
												<Button
													onClick={() => (window.location.href = "/blog")}
													className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
												>
													Check Out Our Blog
												</Button>
											</HideAssistantOnHover>
										</div>
									</div>
								</motion.div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
