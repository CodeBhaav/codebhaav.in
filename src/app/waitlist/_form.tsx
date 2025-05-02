"use client";

import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion, useInView } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	ArrowRight,
	CheckCircle2,
	Copy,
	Instagram,
	Loader,
	Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { submitWaitlist } from "../actions/waitlist/submit";
import Link from "next/link";
import { toast } from "sonner";
const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	role: z.enum(["student", "professional", "other"]),
	otherRole: z.string().optional(),
	whatsapp: z.string().optional(),
	instagram: z.string().optional(),
	reason: z.string().min(1, "Reason is required"),
	referredBy: z.string().optional(),
	interests: z.lazy(() =>
		z.object({
			frontend: z.boolean(),
			backend: z.boolean(),
			mobile: z.boolean(),
			design: z.boolean(),
			ai: z.boolean(),
			other: z.boolean(),
		}),
	),
	otherInterest: z.string().optional(),
});
function WaitlitForm({
	waitlistCount,
	referredBy,
}: { waitlistCount: number; referredBy?: string }) {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [position, setPosition] = useState(0);
	const [referralCode, setReferralCode] = useState("");
	const [currentStep, setCurrentStep] = useState(1);

	const formRef = useRef<HTMLFormElement>(null);
	const isInView = useInView(formRef, { once: true, margin: "-100px" });

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			role: "student",
			otherRole: "",
			whatsapp: "",
			instagram: "",
			reason: "",
			referredBy: referredBy,
			interests: {
				frontend: false,
				backend: false,
				mobile: false,
				design: false,
				ai: false,
				other: false,
			},
			otherInterest: "",
		},
	});

	// 2. Define a submit handler.
	async function onSubmit(values: z.infer<typeof formSchema>) {
		// Do something with the form values.
		// ✅ This will be type-safe and validated.
		const { position, referralCode, error } = await submitWaitlist({
			name: values.name,
			email: values.email,
			role: values.role,
			otherRole: values.otherRole,
			whatsapp: values.whatsapp,
			referredBy: values.referredBy,
			instagram: values.instagram,
			reason: values.reason,
			interests: Object.keys(values.interests).filter(
				(key) => values.interests[key as keyof typeof values.interests],
			),
			otherInterest: values.otherInterest,
		});
		if (error) {
			setPosition(position);
			setReferralCode(referralCode);
			form.setError("root", {
				message: `You are already on the waitlist. Your position is ${position}`,
			});
			return;
		}
		if (referralCode) {
			setPosition(position);
			setReferralCode(referralCode);
			setIsSubmitted(true);
		}
	}

	const nextStep = () => {
		setCurrentStep(currentStep + 1);
	};

	const prevStep = () => {
		setCurrentStep(currentStep - 1);
	};
	const values = form.watch();
	return (
		<>
			{!isSubmitted ? (
				<Form {...form}>
					<form
						ref={formRef}
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-8"
					>
						<motion.div
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
											{currentStep === 1
												? 0
												: Math.round((currentStep / 4) * 100)}
											% completed
										</span>
									</div>
									<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
										<motion.div
											className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
											initial={{
												width: `${((currentStep - 1) / 4) * 100}%`,
											}}
											animate={{
												width: `${currentStep === 1 ? 0 : (currentStep / 4) * 100}%`,
											}}
											transition={{ duration: 0.3 }}
										/>
									</div>
									<div>
										{form.formState.errors.root && (
											<p className="text-red-500 text-sm mt-2">
												{form.formState.errors.root.message} Your referral link
												is
												<Button
													variant="link"
													onClick={() => {
														navigator.clipboard.writeText(
															`https://www.codebhaav.in/waitlist?ref=${referralCode}`,
														);
														alert("Referral link copied to clipboard!");
													}}
												>
													https://www.codebhaav.in/waitlist?ref={referralCode}
												</Button>
											</p>
										)}
									</div>
								</div>
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
												<FormField
													control={form.control}
													name="name"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Full Name</FormLabel>
															<FormControl>
																<Input
																	placeholder="Your name"
																	required
																	className="bg-background/50 border-primary/20 h-12 text-base"
																	{...field}
																/>
															</FormControl>

															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="space-y-2">
												<FormField
													control={form.control}
													name="email"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Email Address</FormLabel>
															<FormControl>
																<Input
																	id="email"
																	type="email"
																	placeholder="you@example.com"
																	required
																	className="bg-background/50 border-primary/20 h-12 text-base"
																	{...field}
																/>
															</FormControl>

															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										<div className="space-y-3">
											<FormField
												control={form.control}
												name="role"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Who are you?</FormLabel>
														<FormControl>
															<RadioGroup
																onValueChange={field.onChange}
																defaultValue={field.value}
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
														</FormControl>
														{values.role === "other" && (
															<div className="pl-7 mt-2">
																<Input
																	name="otherRole"
																	placeholder="Please specify"
																	value={values.otherRole}
																	onChange={(e) =>
																		form.setValue("otherRole", e.target.value)
																	}
																	className="bg-background/50 border-primary/20 h-12 text-base"
																/>
															</div>
														)}
														<FormMessage />
													</FormItem>
												)}
											/>
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
												<FormField
													control={form.control}
													name="whatsapp"
													render={({ field }) => (
														<FormItem>
															<FormLabel>WhatsApp Number (optional)</FormLabel>
															<FormControl>
																<Input
																	id="whatsapp"
																	placeholder="+91 1234567890"
																	className="bg-background/50 border-primary/20 h-12 text-base"
																	{...field}
																/>
															</FormControl>

															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className="space-y-2">
												<FormField
													control={form.control}
													name="instagram"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Instagram Handle (optional)</FormLabel>
															<FormControl>
																<Input
																	id="instagram"
																	placeholder="@yourusername"
																	className="bg-background/50 border-primary/20 h-12 text-base"
																	{...field}
																/>
															</FormControl>

															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										<div className="space-y-3">
											<FormField
												control={form.control}
												name="interests"
												render={() => (
													<FormItem>
														<FormLabel className="text-base">
															What are you interested in? (Select all that
															apply)
														</FormLabel>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
															<FormField
																control={form.control}
																name="interests.frontend"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="frontend"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="frontend"
																			className="cursor-pointer text-base"
																		>
																			Frontend Development
																		</FormLabel>
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="interests.backend"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="backend"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="backend"
																			className="cursor-pointer text-base"
																		>
																			Backend Development
																		</FormLabel>
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="interests.mobile"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="mobile"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="mobile"
																			className="cursor-pointer text-base"
																		>
																			Mobile Development
																		</FormLabel>
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="interests.design"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="design"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="design"
																			className="cursor-pointer text-base"
																		>
																			UI/UX Design
																		</FormLabel>
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="interests.ai"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="ai"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="ai"
																			className="cursor-pointer text-base"
																		>
																			AI/Machine Learning
																		</FormLabel>
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="interests.other"
																render={({ field }) => (
																	<FormItem className="flex items-center space-x-3">
																		<FormControl>
																			<input
																				type="checkbox"
																				className="rounded border-primary/20 text-primary focus:ring-primary/20"
																				checked={field.value}
																				onChange={field.onChange}
																				id="other"
																			/>
																		</FormControl>
																		<FormLabel
																			htmlFor="other"
																			className="cursor-pointer text-base"
																		>
																			Other
																		</FormLabel>
																	</FormItem>
																)}
															/>
														</div>
													</FormItem>
												)}
											/>

											{values.otherInterest && (
												<div className="mt-2">
													<Input
														name="otherInterest"
														placeholder="Please specify"
														value={values.otherInterest}
														onChange={(e) =>
															form.setValue("otherInterest", e.target.value)
														}
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
											<FormField
												control={form.control}
												name="reason"
												render={({ field }) => (
													<FormItem>
														<FormLabel>
															Why do you want to join CodeBhaav?
														</FormLabel>
														<FormControl>
															<Textarea
																id="reason"
																placeholder="Tell us a bit about yourself and why you're interested in joining our community..."
																required
																className="min-h-[150px] bg-background/50 border-primary/20 text-base"
																{...field}
															/>
														</FormControl>

														<FormMessage />
													</FormItem>
												)}
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
												disabled={form.formState.isSubmitting}
												className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
											>
												{form.formState.isSubmitting && (
													<Loader className="mr-2 h-4 w-4 animate-spin" />
												)}
												Join the Waitlist
											</Button>
										</HideAssistantOnHover>
									)}
								</div>
							</div>
						</motion.div>
					</form>
				</Form>
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
							Thank you for joining our waitlist. We'll notify you when we're
							ready to welcome our first members.
						</p>
						<p className="text-muted-foreground mb-4">
							Your position on the waitlist is{" "}
							<span className="font-semibold text-primary">{position}</span>.
							Your referral link is below. Share it with your friends to move up
							the list!
						</p>
						<Button
							variant="default"
							onClick={() => {
								navigator.clipboard.writeText(
									`https://www.codebhaav.in/waitlist?ref=${referralCode}`,
								);
								toast.success("Referral link copied to clipboard!", {
									// Add any options you want here
									duration: 3000,
									description:
										"Share it with your friends to move up the list!",
								});
							}}
							className="mb-2"
						>
							Copy your referral link <Copy className="ml-2 size-4" />
						</Button>
						<p className="text-muted-foreground mb-4">
							You can also follow us on our social media channels to stay
							updated:
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button variant="outline" className="border-primary/20" asChild>
								<Link
									href="https://instagram.com/codebhaav"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Instagram className="size-4" /> Instagram
								</Link>
							</Button>
							<HideAssistantOnHover>
								<Button
									onClick={() => (window.location.href = "/")}
									variant="outline"
									className="border-primary/20"
								>
									Return to Home
								</Button>
							</HideAssistantOnHover>

							{/* <HideAssistantOnHover>
										<Button
											onClick={() => (window.location.href = "/blog")}
											className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
										>
											Check Out Our Blog
										</Button>
									</HideAssistantOnHover> */}
						</div>
					</div>
				</motion.div>
			)}
		</>
	);
}

export default WaitlitForm;
