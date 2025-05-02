"use client";

import type React from "react";

import { PageHeaderMinimal } from "@/components/core/page-header-minimal";

import {
	CheckCircle2,
	Github,
	Instagram,
	Mail,
	MapPin,
	MessageSquare,
	Twitter,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

export default function ContactPage() {
	// const [formState, setFormState] = useState({
	// 	name: "",
	// 	email: "",
	// 	subject: "",
	// 	message: "",
	// });

	// const [isSubmitted, setIsSubmitted] = useState(false);
	// const formRef = useRef(null);
	// const isInView = useInView(formRef, { once: true, margin: "-100px" });

	// const handleChange = (
	// 	e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	// ) => {
	// 	const { name, value } = e.target;
	// 	setFormState((prev) => ({
	// 		...prev,
	// 		[name]: value,
	// 	}));
	// };

	// const handleSubmit = (e: React.FormEvent) => {
	// 	e.preventDefault();
	// 	// Here you would send the form data to your backend
	// 	console.log(formState);
	// 	// Simulate submission
	// 	setTimeout(() => {
	// 		setIsSubmitted(true);
	// 	}, 1000);
	// };

	const contactInfo = [
		{
			icon: <Mail className="w-5 h-5 text-primary" />,
			title: "Email",
			details: "pranav@codebhaav.in",
			link: "mailto:pranav@codebhaav.org",
		},
		// {
		// 	icon: <MessageSquare className="w-5 h-5 text-primary" />,
		// 	title: "Discord",
		// 	details: "Join our Discord server",
		// 	link: "#",
		// },
		{
			icon: <MapPin className="w-5 h-5 text-primary" />,
			title: "Location",
			details: "Amravati, Maharashtra, India",
			link: "https://maps.google.com/?q=Amravati,Maharashtra,India",
		},
	];

	const socialLinks = [
		{
			icon: <Github className="w-5 h-5" />,
			link: "https://github.com/codebhaav",
			name: "GitHub",
		},

		{
			icon: <Instagram className="w-5 h-5" />,
			link: "https://instagram.com/codebhaav",
			name: "Instagram",
		},
	];
	const contactCodeSnippet = `// Contact Us
function sendMessage(name, email, subject, message) {
  const contactDetails = {
    name,
    email,
    subject,
    message
  };
  
  return submitToTeam(contactDetails);
}
`;
	return (
		<div className="min-h-screen">
			<PageHeaderMinimal
				title="Contact Us"
				description="Get in touch with the CodeBhaav team"
				ctaText="Join Our Mission"
				variant="gradient"
				titleColor="gradient"
				size="large"
				codeSnippet={contactCodeSnippet}
			/>
			<div className="container px-4 py-16 md:py-24">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-1  gap-12">
						{/* lg:grid-cols-3 */}
						<div className="lg:col-span-1">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8 }}
								className="sticky top-24"
							>
								<h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
								<p className="text-muted-foreground mb-8">
									Have questions, suggestions, or just want to say hello? We'd
									love to hear from you! Fill out the form or reach out to us
									directly using the contact information below.
								</p>

								<div className="space-y-6 mb-8">
									{contactInfo.map((item, index) => (
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
													{item.icon}
												</div>
												<div>
													<h3 className="text-lg font-bold mb-1">
														{item.title}
													</h3>
													<a
														href={item.link}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-primary hover:underline"
													>
														{item.details}
													</a>
												</div>
											</div>
										</motion.div>
									))}
								</div>

								<h3 className="text-lg font-bold mb-4">Follow Us</h3>
								<div className="flex gap-3">
									{socialLinks.map((social, index) => (
										<motion.a
											key={index}
											href={social.link}
											target="_blank"
											rel="noopener noreferrer"
											whileHover={{ y: -5, scale: 1.1 }}
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 10,
											}}
											className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80"
											aria-label={`Follow us on ${social.name}`}
										>
											{social.icon}
										</motion.a>
									))}
								</div>
							</motion.div>
						</div>

						{/* <div className="lg:col-span-2">
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
										<div className="mb-8">
											<h2 className="text-2xl md:text-3xl font-bold">
												Send Us a Message
											</h2>
											<p className="text-muted-foreground mt-1">
												We'll get back to you as soon as possible
											</p>
										</div>

										<form onSubmit={handleSubmit} className="space-y-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div className="space-y-2">
													<Label htmlFor="name" className="text-base">
														Your Name
													</Label>
													<Input
														id="name"
														name="name"
														placeholder="John Doe"
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

											<div className="space-y-2">
												<Label htmlFor="subject" className="text-base">
													Subject
												</Label>
												<Input
													id="subject"
													name="subject"
													placeholder="What is this regarding?"
													value={formState.subject}
													onChange={handleChange}
													required
													className="bg-background/50 border-primary/20 h-12 text-base"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="message" className="text-base">
													Your Message
												</Label>
												<Textarea
													id="message"
													name="message"
													placeholder="How can we help you?"
													value={formState.message}
													onChange={handleChange}
													required
													className="min-h-[200px] bg-background/50 border-primary/20 text-base"
												/>
											</div>

											<div className="pt-4">
												<HideAssistantOnHover>
													<Button
														type="submit"
														className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 w-full md:w-auto px-8"
													>
														Send Message
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
											Message Sent!
										</h2>
										<p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
											Thank you for reaching out. We've received your message
											and will get back to you as soon as possible.
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
						</div> */}
					</div>
				</div>
			</div>
		</div>
	);
}
