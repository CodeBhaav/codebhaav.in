import { useState, useCallback, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface FormData {
	name: string;
	email: string;
	whatsapp: string;
	github: string;
	linkedin: string;
	portfolio: string;
	skills: string;
	experience: string;
	motivation: string;
	commitment: string;
	ideas: string;
}

interface FormErrors {
	name?: string;
	email?: string;
	whatsapp?: string;
	skills?: string;
	experience?: string;
	motivation?: string;
	commitment?: string;
}

const INITIAL_FORM_DATA: FormData = {
	name: "",
	email: "",
	whatsapp: "",
	github: "",
	linkedin: "",
	portfolio: "",
	skills: "",
	experience: "",
	motivation: "",
	commitment: "",
	ideas: "",
};

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(data: FormData): FormErrors {
	const errors: FormErrors = {};

	if (!data.name.trim()) {
		errors.name = "Name is required";
	}
	if (!data.email.trim()) {
		errors.email = "Email is required";
	} else if (!isValidEmail(data.email)) {
		errors.email = "Please enter a valid email address";
	}
	if (!data.whatsapp.trim()) {
		errors.whatsapp = "WhatsApp number is required";
	}
	if (!data.skills.trim()) {
		errors.skills = "Please describe your skills";
	}
	if (!data.experience.trim()) {
		errors.experience = "Please describe your experience";
	}
	if (!data.motivation.trim()) {
		errors.motivation = "Please tell us your motivation";
	}
	if (!data.commitment.trim()) {
		errors.commitment = "Please describe your time commitment";
	}

	return errors;
}

function CheckmarkIcon() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="24" cy="24" r="24" fill="#22C55E" fillOpacity="0.1" />
			<circle cx="24" cy="24" r="16" fill="#22C55E" fillOpacity="0.2" />
			<path
				d="M17 24L22 29L31 19"
				stroke="#22C55E"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function SuccessScreen() {
	return (
		<div className="flex flex-col items-center py-16 text-center">
			<CheckmarkIcon />
			<h2 className="mt-6 text-2xl font-bold text-[#FAFAFA]">
				Application received!
			</h2>
			<p className="mt-2 text-sm text-[#71717A]">
				We'll review and get back to you within 7 days.
			</p>
			<a
				href="/"
				className="mt-8 text-sm font-medium text-[#F59E0B] transition-colors hover:text-[#D97706]"
			>
				Return home &rarr;
			</a>
		</div>
	);
}

function SectionHeader({ children }: { children: string }) {
	return (
		<p className="mb-4 text-sm font-medium uppercase tracking-wider text-[#71717A]">
			{children}
		</p>
	);
}

function FieldLabel({
	htmlFor,
	required,
	children,
}: {
	htmlFor: string;
	required?: boolean;
	children: string;
}) {
	return (
		<label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#FAFAFA]">
			{children}
			{required && <span className="ml-0.5 text-[#F59E0B]">*</span>}
		</label>
	);
}

function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

const INPUT_CLASS =
	"w-full bg-[#111113] border border-[#1F1F23] rounded-[6px] px-4 py-3 text-[#FAFAFA] placeholder-[#52525B] focus:border-[#F59E0B] focus:outline-none text-sm transition-colors";

const TEXTAREA_CLASS = `${INPUT_CLASS} resize-y`;

export function FoundingMemberForm() {
	const submitApplication = useMutation(api.foundingMember.submitApplication);

	const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const updateField = useCallback(
		(field: keyof FormData, value: string) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			setErrors((prev) => {
				if (!prev[field as keyof FormErrors]) return prev;
				const next = { ...prev };
				delete next[field as keyof FormErrors];
				return next;
			});
		},
		[],
	);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setSubmitError(null);

			const validationErrors = validateForm(formData);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}

			setIsSubmitting(true);
			try {
				await submitApplication({
					name: formData.name.trim(),
					email: formData.email.trim(),
					whatsapp: formData.whatsapp.trim(),
					github: formData.github.trim() || undefined,
					linkedin: formData.linkedin.trim() || undefined,
					portfolio: formData.portfolio.trim() || undefined,
					skills: formData.skills.trim(),
					experience: formData.experience.trim(),
					motivation: formData.motivation.trim(),
					commitment: formData.commitment.trim(),
					ideas: formData.ideas.trim() || undefined,
				});
				setIsSuccess(true);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Something went wrong. Please try again.";
				setSubmitError(message);
			} finally {
				setIsSubmitting(false);
			}
		},
		[formData, submitApplication],
	);

	if (isSuccess) {
		return <SuccessScreen />;
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-8">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
						Founding Member Application
					</h1>
					<span className="rounded-[4px] border border-[#1F1F23] bg-[#111113] px-2 py-1 text-xs text-[#71717A]">
						Limited spots available
					</span>
				</div>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-10" noValidate>
				{/* Personal Information */}
				<fieldset className="space-y-5">
					<SectionHeader>Personal Information</SectionHeader>

					<div>
						<FieldLabel htmlFor="name" required>
							Full Name
						</FieldLabel>
						<input
							id="name"
							type="text"
							placeholder="Your full name"
							value={formData.name}
							onChange={(e) => updateField("name", e.target.value)}
							className={INPUT_CLASS}
						/>
						<FieldError message={errors.name} />
					</div>

					<div>
						<FieldLabel htmlFor="whatsapp" required>
							WhatsApp Number
						</FieldLabel>
						<input
							id="whatsapp"
							type="tel"
							placeholder="+91 98765 43210"
							value={formData.whatsapp}
							onChange={(e) => updateField("whatsapp", e.target.value)}
							className={INPUT_CLASS}
						/>
						<FieldError message={errors.whatsapp} />
					</div>

					<div>
						<FieldLabel htmlFor="email" required>
							Email Address
						</FieldLabel>
						<input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={formData.email}
							onChange={(e) => updateField("email", e.target.value)}
							className={INPUT_CLASS}
						/>
						<FieldError message={errors.email} />
					</div>

					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<FieldLabel htmlFor="github">GitHub Profile</FieldLabel>
							<input
								id="github"
								type="url"
								placeholder="https://github.com/username"
								value={formData.github}
								onChange={(e) => updateField("github", e.target.value)}
								className={INPUT_CLASS}
							/>
						</div>
						<div>
							<FieldLabel htmlFor="linkedin">LinkedIn Profile</FieldLabel>
							<input
								id="linkedin"
								type="url"
								placeholder="https://linkedin.com/in/username"
								value={formData.linkedin}
								onChange={(e) => updateField("linkedin", e.target.value)}
								className={INPUT_CLASS}
							/>
						</div>
					</div>

					<div>
						<FieldLabel htmlFor="portfolio">Portfolio / Website</FieldLabel>
						<input
							id="portfolio"
							type="url"
							placeholder="https://yoursite.com"
							value={formData.portfolio}
							onChange={(e) => updateField("portfolio", e.target.value)}
							className={INPUT_CLASS}
						/>
					</div>
				</fieldset>

				{/* Skills & Experience */}
				<fieldset className="space-y-5">
					<SectionHeader>Skills & Experience</SectionHeader>

					<div>
						<FieldLabel htmlFor="skills" required>
							What skills can you contribute?
						</FieldLabel>
						<textarea
							id="skills"
							rows={3}
							placeholder="e.g. React, Node.js, UI/UX design, content writing, community management..."
							value={formData.skills}
							onChange={(e) => updateField("skills", e.target.value)}
							className={TEXTAREA_CLASS}
						/>
						<FieldError message={errors.skills} />
					</div>

					<div>
						<FieldLabel htmlFor="experience" required>
							Your relevant experience
						</FieldLabel>
						<textarea
							id="experience"
							rows={3}
							placeholder="Tell us about projects you've built, communities you've contributed to, or any relevant experience..."
							value={formData.experience}
							onChange={(e) => updateField("experience", e.target.value)}
							className={TEXTAREA_CLASS}
						/>
						<FieldError message={errors.experience} />
					</div>
				</fieldset>

				{/* Motivation */}
				<fieldset className="space-y-5">
					<SectionHeader>Motivation</SectionHeader>

					<div>
						<FieldLabel htmlFor="motivation" required>
							Why do you want to be a founding member?
						</FieldLabel>
						<textarea
							id="motivation"
							rows={3}
							placeholder="What excites you about CodeBhaav and why do you want to be part of the founding team?"
							value={formData.motivation}
							onChange={(e) => updateField("motivation", e.target.value)}
							className={TEXTAREA_CLASS}
						/>
						<FieldError message={errors.motivation} />
					</div>

					<div>
						<FieldLabel htmlFor="commitment" required>
							Weekly time commitment
						</FieldLabel>
						<textarea
							id="commitment"
							rows={2}
							placeholder="How many hours per week can you dedicate? What days/times work best?"
							value={formData.commitment}
							onChange={(e) => updateField("commitment", e.target.value)}
							className={TEXTAREA_CLASS}
						/>
						<FieldError message={errors.commitment} />
					</div>

					<div>
						<FieldLabel htmlFor="ideas">Ideas for the community</FieldLabel>
						<textarea
							id="ideas"
							rows={3}
							placeholder="Any ideas for events, projects, resources, or initiatives you'd like to see or lead?"
							value={formData.ideas}
							onChange={(e) => updateField("ideas", e.target.value)}
							className={TEXTAREA_CLASS}
						/>
					</div>
				</fieldset>

				{/* Legal + Submit */}
				<div className="space-y-4">
					<p className="text-xs leading-relaxed text-[#52525B]">
						By submitting this application, you agree to our{" "}
						<a
							href="/terms"
							className="text-[#71717A] underline transition-colors hover:text-[#FAFAFA]"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="/privacy"
							className="text-[#71717A] underline transition-colors hover:text-[#FAFAFA]"
						>
							Privacy Policy
						</a>
						. We will review your application and get back to you within 7 days.
					</p>

					{submitError && (
						<div className="rounded-[6px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
							{submitError}
						</div>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className="inline-flex h-11 w-full items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
					>
						{isSubmitting ? "Submitting..." : "Submit Application"}
					</button>
				</div>
			</form>
		</div>
	);
}
