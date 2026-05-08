import { useState, useCallback, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";

interface FormData {
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
	whatsapp?: string;
	skills?: string;
	experience?: string;
	motivation?: string;
	commitment?: string;
}

const INITIAL_FORM_DATA: FormData = {
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

function validateForm(data: FormData): FormErrors {
	const errors: FormErrors = {};

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

const LOCKED_INPUT_CLASS =
	"w-full bg-[#0a0a0a] border border-[#1F1F23] rounded-[6px] px-4 py-3 text-[#a1a1aa] text-sm cursor-not-allowed";

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

const STATUS_CONFIG: Record<
	ApplicationStatus,
	{ label: string; tone: "neutral" | "positive" | "negative"; description: string }
> = {
	submitted: {
		label: "Submitted",
		tone: "neutral",
		description:
			"We've received your application. We'll review it and get back to you within 7 days.",
	},
	in_review: {
		label: "In review",
		tone: "neutral",
		description:
			"Your application is being reviewed by the team. We'll be in touch soon.",
	},
	accepted: {
		label: "Accepted",
		tone: "positive",
		description:
			"You're in. Welcome to the founding cohort. Watch your inbox for next steps.",
	},
	rejected: {
		label: "Not selected",
		tone: "negative",
		description:
			"We weren't able to bring you into the founding cohort this time. You're still on the waitlist.",
	},
};

function StatusView({
	status,
	submittedAt,
}: {
	status: ApplicationStatus;
	submittedAt: number;
}) {
	const config = STATUS_CONFIG[status];
	const dateLabel = new Date(submittedAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const toneClasses = {
		neutral: "border-[#1F1F23] bg-[#111113] text-[#a1a1aa]",
		positive: "border-[#f59e0b] bg-[#241906] text-[#fbbf24]",
		negative: "border-[#3a1a1a] bg-[#1a0a0a] text-[#f87171]",
	}[config.tone];

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
					Founding Member Application
				</h1>
				<p className="mt-2 text-sm text-[#71717A]">
					Submitted on {dateLabel}
				</p>
			</div>

			<div className="rounded-[6px] border border-[#1F1F23] bg-[#0a0a0a] p-6">
				<p className="font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
					Status
				</p>
				<div className="mt-3 flex items-center gap-3">
					<span
						className={cn(
							"inline-flex items-center rounded-[4px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
							toneClasses,
						)}
					>
						{config.label}
					</span>
				</div>
				<p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">
					{config.description}
				</p>
			</div>

			<div className="mt-6 flex flex-wrap gap-3">
				<a
					href="/dashboard"
					className="inline-flex h-9 items-center rounded-button border border-border px-4 text-[13px] text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
				>
					Back to dashboard &rarr;
				</a>
			</div>
		</div>
	);
}

function SignedOutView() {
	return (
		<div className="rounded-[6px] border border-[#1F1F23] bg-[#0a0a0a] p-8 text-center">
			<h2 className="text-xl font-semibold text-[#FAFAFA]">
				Sign in to apply
			</h2>
			<p className="mt-2 text-sm text-[#a1a1aa]">
				Founding member applications are tied to your account. Sign in or
				create one to continue.
			</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">
				<a
					href="/sign-in?redirect_url=/founding-member"
					className="inline-flex h-10 items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B]"
				>
					Sign In
				</a>
				<a
					href="/sign-up?redirect_url=/founding-member"
					className="inline-flex h-10 items-center justify-center rounded-button border border-border px-6 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
				>
					Create Account
				</a>
			</div>
		</div>
	);
}

export function FoundingMemberForm() {
	const { user, isLoaded } = useUser();
	const clerkUserId = user?.id;
	const fullName = [user?.firstName, user?.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	const email = user?.primaryEmailAddress?.emailAddress ?? "";

	const submitApplication = useMutation(api.foundingMember.submitApplication);
	const existingApplication = useQuery(
		api.foundingMember.getMyApplication,
		clerkUserId ? { clerkUserId } : "skip",
	);

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

			if (!clerkUserId || !fullName || !email) {
				setSubmitError("Account info missing. Please try signing in again.");
				return;
			}

			const validationErrors = validateForm(formData);
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors);
				return;
			}

			setIsSubmitting(true);
			try {
				await submitApplication({
					clerkUserId,
					name: fullName,
					email,
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
				posthog.identify(email, { name: fullName, email });
				posthog.capture("founding_member_application_submitted", {
					has_github: Boolean(formData.github.trim()),
					has_linkedin: Boolean(formData.linkedin.trim()),
					has_portfolio: Boolean(formData.portfolio.trim()),
					has_ideas: Boolean(formData.ideas.trim()),
				});
				setIsSuccess(true);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Something went wrong. Please try again.";
				setSubmitError(message);
				posthog.capture("founding_member_application_error", { error_message: message });
				posthog.captureException(err instanceof Error ? err : new Error(message));
			} finally {
				setIsSubmitting(false);
			}
		},
		[clerkUserId, fullName, email, formData, submitApplication],
	);

	if (!isLoaded) {
		return (
			<div className="py-12">
				<div className="h-6 w-64 animate-pulse rounded-[4px] bg-[#1F1F23]" />
				<div className="mt-6 h-32 animate-pulse rounded-[6px] bg-[#1F1F23]" />
			</div>
		);
	}

	if (!user) {
		return <SignedOutView />;
	}

	if (existingApplication === undefined) {
		return (
			<div className="py-12">
				<div className="h-6 w-64 animate-pulse rounded-[4px] bg-[#1F1F23]" />
				<div className="mt-6 h-32 animate-pulse rounded-[6px] bg-[#1F1F23]" />
			</div>
		);
	}

	if (existingApplication) {
		return (
			<StatusView
				status={existingApplication.status as ApplicationStatus}
				submittedAt={existingApplication.submittedAt}
			/>
		);
	}

	if (isSuccess) {
		return (
			<StatusView status="submitted" submittedAt={Date.now()} />
		);
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
						<FieldLabel htmlFor="name">Full Name</FieldLabel>
						<input
							id="name"
							type="text"
							value={fullName}
							readOnly
							className={LOCKED_INPUT_CLASS}
						/>
						<p className="mt-1 text-xs text-[#52525B]">
							From your account. Update it in your profile.
						</p>
					</div>

					<div>
						<FieldLabel htmlFor="email">Email Address</FieldLabel>
						<input
							id="email"
							type="email"
							value={email}
							readOnly
							className={LOCKED_INPUT_CLASS}
						/>
						<p className="mt-1 text-xs text-[#52525B]">
							From your account. Update it in your profile.
						</p>
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
						className="inline-flex h-11 w-full items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
					>
						{isSubmitting ? "Submitting..." : "Submit Application"}
					</button>
				</div>
			</form>
		</div>
	);
}
