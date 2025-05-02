"use client";

import type React from "react";

import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion, useInView } from "motion/react";
import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeaderMinimal } from "@/components/core/page-header-minimal";

export default function WaitlistPage() {
	const [formState, setFormState] = useState({
		name: "",
		email: "",
		role: "student",
		otherRole: "",
		whatsapp: "",
		instagram: "",
		reason: "",
		interests: {
			frontend: false,
			backend: false,
			mobile: false,
			design: false,
			ai: false,
			other: false,
		},
		otherInterest: "",
	});

	const [isSubmitted, setIsSubmitted] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	const waitlistCount = 42; // This would be fetched from your database in a real implementation

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

	const handleRoleChange = (value: string) => {
		setFormState((prev) => ({
			...prev,
			role: value,
		}));
	};

	const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setFormState((prev) => ({
			...prev,
			interests: {
				...prev.interests,
				[name]: checked,
			},
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

	const nextStep = () => {
		setCurrentStep(currentStep + 1);
	};

	const prevStep = () => {
		setCurrentStep(currentStep - 1);
	};

	return (
		<div className="min-h-screen">
			<PageHeaderMinimal
				size="large"
				title="Join the Waitlist"
				description="Be among the first to join our community of self-taught developers."
			/>

			<div className="container px-4 py-16 md:py-24">
				<div className="max-w-4xl mx-auto">
					{!isSubmitted ? (
						<motion.div
							ref={formRef}
							initial={{ opacity: 0, y: 20 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
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
											Request Early Access
										</h2>
										<p className="text-muted-foreground mt-1">
											Join our community of passionate developers
										</p>
									</div>
									<div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
										<Users className="w-4 h-4 text-primary" />
										<span className="text-sm font-medium">
											{waitlistCount} people waiting
										</span>
									</div>
								</div>

								{/* Progress Steps */}
								<div className="mb-8">
									<div className="flex justify-between items-center mb-2">
										<span className="text-sm font-medium">
											Step {currentStep} of 3
										</span>
										<span className="text-sm text-muted-foreground">
											{Math.round((currentStep / 3) * 100)}% completed
										</span>
									</div>
									<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
										<motion.div
											className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
											initial={{ width: `${((currentStep - 1) / 3) * 100}%` }}
											animate={{ width: `${(currentStep / 3) * 100}%` }}
											transition={{ duration: 0.3 }}
										/>
									</div>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									{currentStep === 1 && (
										<motion.div
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											transition={{ duration: 0.3 }}
											className="space-y-6"
										>
											<h3 className="text-xl font-semibold mb-4">
												Tell us about yourself
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

											<div className="space-y-3">
												<Label className="text-base">Who are you?</Label>
												<RadioGroup
													value={formState.role}
													onValueChange={handleRoleChange}
													className="flex flex-col space-y-3"
												>
													<div className="flex items-center space-x-3">
														<RadioGroupItem
															value="student"
															id="student"
															className="border-primary/20"
														/>
														<Label
															htmlFor="student"
															className="cursor-pointer text-base"
														>
															Student
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<RadioGroupItem
															value="professional"
															id="professional"
															className="border-primary/20"
														/>
														<Label
															htmlFor="professional"
															className="cursor-pointer text-base"
														>
															Professional
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<RadioGroupItem
															value="other"
															id="other"
															className="border-primary/20"
														/>
														<Label
															htmlFor="other"
															className="cursor-pointer text-base"
														>
															Other
														</Label>
													</div>
												</RadioGroup>

												{formState.role === "other" && (
													<div className="pl-7 mt-2">
														<Input
															name="otherRole"
															placeholder="Please specify"
															value={formState.otherRole}
															onChange={handleChange}
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>
												)}
											</div>
										</motion.div>
									)}

									{currentStep === 2 && (
										<motion.div
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											transition={{ duration: 0.3 }}
											className="space-y-6"
										>
											<h3 className="text-xl font-semibold mb-4">
												Contact Information
											</h3>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<Label htmlFor="whatsapp" className="text-base">
														WhatsApp Number (optional)
													</Label>
													<Input
														id="whatsapp"
														name="whatsapp"
														placeholder="+91 1234567890"
														value={formState.whatsapp}
														onChange={handleChange}
														className="bg-background/50 border-primary/20 h-12 text-base"
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="instagram" className="text-base">
														Instagram Handle (optional)
													</Label>
													<Input
														id="instagram"
														name="instagram"
														placeholder="@yourusername"
														value={formState.instagram}
														onChange={handleChange}
														className="bg-background/50 border-primary/20 h-12 text-base"
													/>
												</div>
											</div>

											<div className="space-y-3">
												<Label className="text-base">
													What are you interested in? (Select all that apply)
												</Label>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="frontend"
															name="frontend"
															checked={formState.interests.frontend}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="frontend"
															className="cursor-pointer text-base"
														>
															Frontend Development
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="backend"
															name="backend"
															checked={formState.interests.backend}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="backend"
															className="cursor-pointer text-base"
														>
															Backend Development
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="mobile"
															name="mobile"
															checked={formState.interests.mobile}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="mobile"
															className="cursor-pointer text-base"
														>
															Mobile Development
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="design"
															name="design"
															checked={formState.interests.design}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="design"
															className="cursor-pointer text-base"
														>
															UI/UX Design
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="ai"
															name="ai"
															checked={formState.interests.ai}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="ai"
															className="cursor-pointer text-base"
														>
															AI/Machine Learning
														</Label>
													</div>
													<div className="flex items-center space-x-3">
														<input
															type="checkbox"
															id="other"
															name="other"
															checked={formState.interests.other}
															onChange={handleInterestChange}
															className="rounded border-primary/20 text-primary focus:ring-primary/20"
														/>
														<Label
															htmlFor="other"
															className="cursor-pointer text-base"
														>
															Other
														</Label>
													</div>
												</div>

												{formState.interests.other && (
													<div className="mt-2">
														<Input
															name="otherInterest"
															placeholder="Please specify"
															value={formState.otherInterest}
															onChange={handleChange}
															className="bg-background/50 border-primary/20 h-12 text-base"
														/>
													</div>
												)}
											</div>
										</motion.div>
									)}

									{currentStep === 3 && (
										<motion.div
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -20 }}
											transition={{ duration: 0.3 }}
											className="space-y-6"
										>
											<h3 className="text-xl font-semibold mb-4">
												Why CodeBhaav?
											</h3>

											<div className="space-y-2">
												<Label htmlFor="reason" className="text-base">
													Why do you want to join CodeBhaav?
												</Label>
												<Textarea
													id="reason"
													name="reason"
													placeholder="Tell us a bit about yourself and why you're interested in joining our community..."
													value={formState.reason}
													onChange={handleChange}
													required
													className="min-h-[150px] bg-background/50 border-primary/20 text-base"
												/>
											</div>

											<div className="pt-4">
												<p className="text-sm text-muted-foreground mb-2">
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
											</div>
										</motion.div>
									)}

									<div className="flex justify-between pt-4">
										{currentStep > 1 ? (
											<HideAssistantOnHover>
												<Button
													type="button"
													variant="outline"
													onClick={prevStep}
													className="border-primary/20"
												>
													Back
												</Button>
											</HideAssistantOnHover>
										) : (
											<div />
										)}

										{currentStep < 3 ? (
											<HideAssistantOnHover>
												<Button
													type="button"
													onClick={nextStep}
													className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
												>
													Continue
													<ArrowRight className="ml-2 h-4 w-4" />
												</Button>
											</HideAssistantOnHover>
										) : (
											<HideAssistantOnHover>
												<Button
													type="submit"
													className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
												>
													Join the Waitlist
												</Button>
											</HideAssistantOnHover>
										)}
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
									You're on the list!
								</h2>
								<p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
									Thank you for joining our waitlist. We'll notify you when
									we're ready to welcome our first members.
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
	);
}
