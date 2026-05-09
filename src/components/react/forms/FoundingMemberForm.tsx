import { useState, useCallback, useEffect, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import posthog from "posthog-js";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/react/ui/checkbox";

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
	newsletter: boolean;
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
	newsletter: false,
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

const TONE_CLASSES = {
	neutral: "border-[#1F1F23] bg-[#111113] text-[#a1a1aa]",
	positive: "border-[#f59e0b] bg-[#241906] text-[#fbbf24]",
	negative: "border-[#3a1a1a] bg-[#1a0a0a] text-[#f87171]",
} as const;

function formatDate(ms: number): string {
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function ReadOnlyField({
	label,
	value,
	multiline,
}: {
	label: string;
	value: string;
	multiline?: boolean;
}) {
	const display = value && value.trim().length > 0 ? value : "—";
	return (
		<div>
			<p className="mb-1.5 text-sm font-medium text-[#FAFAFA]">{label}</p>
			<div
				className={cn(
					"rounded-[6px] border border-[#1F1F23] bg-[#0a0a0a] px-4 py-3 text-sm text-[#a1a1aa]",
					multiline ? "whitespace-pre-wrap" : "truncate",
				)}
			>
				{display}
			</div>
		</div>
	);
}

interface ProfileSnapshot {
	whatsapp: string;
	github: string;
	linkedin: string;
	portfolio: string;
	skills: string;
	experience: string;
}

interface ApplicationSnapshot {
	status: ApplicationStatus;
	submittedAt: number;
	name: string;
	email: string;
	motivation: string;
	commitment: string;
	ideas: string;
}

function SubmissionSummary({
	application,
	profile,
	onEdit,
}: {
	application: ApplicationSnapshot;
	profile: ProfileSnapshot;
	onEdit?: () => void;
}) {
	const config = STATUS_CONFIG[application.status];

	return (
		<div>
			<div className="mb-8 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
						Founding Member Application
					</h1>
					<p className="mt-2 text-sm text-[#71717A]">
						Submitted on {formatDate(application.submittedAt)}
					</p>
				</div>
				{onEdit && (
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex h-9 items-center rounded-button border border-[#1F1F23] bg-[#111113] px-4 text-[13px] font-medium text-[#FAFAFA] transition-colors hover:border-[#f59e0b] hover:text-[#f59e0b]"
					>
						Edit application
					</button>
				)}
			</div>

			<div className="rounded-[6px] border border-[#1F1F23] bg-[#0a0a0a] p-6">
				<p className="font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
					Status
				</p>
				<div className="mt-3 flex items-center gap-3">
					<span
						className={cn(
							"inline-flex items-center rounded-[4px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
							TONE_CLASSES[config.tone],
						)}
					>
						{config.label}
					</span>
				</div>
				<p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">
					{config.description}
				</p>
				{onEdit && application.status === "submitted" && (
					<p className="mt-3 text-xs text-[#71717A]">
						You can still edit any field until review starts.
					</p>
				)}
			</div>

			<div className="mt-10 space-y-10">
				<fieldset className="space-y-5">
					<SectionHeader>What you submitted · Personal</SectionHeader>
					<ReadOnlyField label="Full Name" value={application.name} />
					<ReadOnlyField label="Email Address" value={application.email} />
					<ReadOnlyField label="WhatsApp Number" value={profile.whatsapp} />
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<ReadOnlyField label="GitHub Profile" value={profile.github} />
						<ReadOnlyField label="LinkedIn Profile" value={profile.linkedin} />
					</div>
					<ReadOnlyField label="Portfolio / Website" value={profile.portfolio} />
				</fieldset>

				<fieldset className="space-y-5">
					<SectionHeader>What you submitted · Skills & Experience</SectionHeader>
					<ReadOnlyField
						label="What skills can you contribute?"
						value={profile.skills}
						multiline
					/>
					<ReadOnlyField
						label="Your relevant experience"
						value={profile.experience}
						multiline
					/>
				</fieldset>

				<fieldset className="space-y-5">
					<SectionHeader>What you submitted · Motivation</SectionHeader>
					<ReadOnlyField
						label="Why do you want to be a founding member?"
						value={application.motivation}
						multiline
					/>
					<ReadOnlyField
						label="Weekly time commitment"
						value={application.commitment}
						multiline
					/>
					<ReadOnlyField
						label="Ideas for the community"
						value={application.ideas}
						multiline
					/>
				</fieldset>
			</div>

			<div className="mt-10 flex flex-wrap gap-3">
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

function EditableNotice({ submittedAt }: { submittedAt: number }) {
	return (
		<div className="mb-8 rounded-[6px] border border-[#1F1F23] bg-[#0a0a0a] p-4">
			<div className="flex flex-wrap items-center gap-3">
				<span
					className={cn(
						"inline-flex items-center rounded-[4px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
						TONE_CLASSES.neutral,
					)}
				>
					Submitted
				</span>
				<p className="text-xs text-[#a1a1aa]">
					Submitted on {formatDate(submittedAt)}. You can edit any field
					until review starts.
				</p>
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
	const updateApplication = useMutation(api.foundingMember.updateMyApplication);
	const existingApplication = useQuery(
		api.foundingMember.getMyApplication,
		clerkUserId ? {} : "skip",
	);
	const profile = useQuery(
		api.userProfile.getMyProfile,
		clerkUserId ? {} : "skip",
	);

	const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
	const [prefilled, setPrefilled] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [savedAt, setSavedAt] = useState<number | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);

	const hasApplication =
		existingApplication !== null && existingApplication !== undefined;
	const applicationStatus = hasApplication
		? ((existingApplication.status ?? "submitted") as ApplicationStatus)
		: null;
	const canEdit = applicationStatus === "submitted";
	// "Editing-submitted" means: there's an existing submitted application
	// AND the user is currently in edit mode. Otherwise it's a new submission.
	const isEditingSubmitted = hasApplication && isEditMode && canEdit;

	// One-shot prefill of profile (always) + application fields (when an
	// application exists). Runs once both queries have resolved so we
	// don't snap fields back to saved values mid-typing.
	useEffect(() => {
		if (prefilled) return;
		if (profile === undefined || existingApplication === undefined) return;

		setFormData((prev) => ({
			...prev,
			whatsapp: profile?.whatsapp || prev.whatsapp,
			github: profile?.github || prev.github,
			linkedin: profile?.linkedin || prev.linkedin,
			portfolio: profile?.portfolio || prev.portfolio,
			skills: profile?.skills || prev.skills,
			experience: profile?.experience || prev.experience,
			motivation: hasApplication
				? (existingApplication?.motivation ?? prev.motivation)
				: prev.motivation,
			commitment: hasApplication
				? (existingApplication?.commitment ?? prev.commitment)
				: prev.commitment,
			ideas: hasApplication
				? (existingApplication?.ideas ?? prev.ideas)
				: prev.ideas,
			newsletter: hasApplication
				? (existingApplication?.newsletter ?? prev.newsletter)
				: (profile?.newsletter ?? prev.newsletter),
		}));
		setPrefilled(true);
	}, [profile, existingApplication, hasApplication, prefilled]);

	// Re-sync formData with the latest saved values. Used when entering
	// edit mode (so we discard any stale local edits) and when cancelling
	// edit mode.
	const resetFormToSaved = useCallback(() => {
		setFormData({
			whatsapp: profile?.whatsapp ?? "",
			github: profile?.github ?? "",
			linkedin: profile?.linkedin ?? "",
			portfolio: profile?.portfolio ?? "",
			skills: profile?.skills ?? "",
			experience: profile?.experience ?? "",
			motivation: existingApplication?.motivation ?? "",
			commitment: existingApplication?.commitment ?? "",
			ideas: existingApplication?.ideas ?? "",
			newsletter:
				existingApplication?.newsletter ?? profile?.newsletter ?? false,
		});
		setErrors({});
		setSubmitError(null);
	}, [profile, existingApplication]);

	const handleEnterEdit = useCallback(() => {
		resetFormToSaved();
		setIsEditMode(true);
	}, [resetFormToSaved]);

	const handleCancelEdit = useCallback(() => {
		resetFormToSaved();
		setIsEditMode(false);
	}, [resetFormToSaved]);

	// Auto-clear the inline "Saved" notice after 3 seconds.
	useEffect(() => {
		if (savedAt === null) return;
		const t = setTimeout(() => setSavedAt(null), 3000);
		return () => clearTimeout(t);
	}, [savedAt]);

	const updateField = useCallback(
		<K extends keyof FormData>(field: K, value: FormData[K]) => {
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
				if (isEditingSubmitted) {
					await updateApplication({
						whatsapp: formData.whatsapp.trim(),
						github: formData.github.trim() || undefined,
						linkedin: formData.linkedin.trim() || undefined,
						portfolio: formData.portfolio.trim() || undefined,
						skills: formData.skills.trim(),
						experience: formData.experience.trim(),
						motivation: formData.motivation.trim(),
						commitment: formData.commitment.trim(),
						ideas: formData.ideas.trim() || undefined,
						newsletter: formData.newsletter,
					});
					posthog.capture("founding_member_application_updated");
				} else {
					await submitApplication({
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
						newsletter: formData.newsletter,
					});
					posthog.identify(email, { name: fullName, email });
					posthog.capture("founding_member_application_submitted", {
						has_github: Boolean(formData.github.trim()),
						has_linkedin: Boolean(formData.linkedin.trim()),
						has_portfolio: Boolean(formData.portfolio.trim()),
						has_ideas: Boolean(formData.ideas.trim()),
					});
				}
				setSavedAt(Date.now());
				// After a successful save while editing, drop back to the
				// summary view so the user sees their (now-updated) data.
				if (isEditingSubmitted) {
					setIsEditMode(false);
				}
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
		[
			clerkUserId,
			fullName,
			email,
			formData,
			isEditingSubmitted,
			submitApplication,
			updateApplication,
		],
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

	if (existingApplication === undefined || profile === undefined) {
		return (
			<div className="py-12">
				<div className="h-6 w-64 animate-pulse rounded-[4px] bg-[#1F1F23]" />
				<div className="mt-6 h-32 animate-pulse rounded-[6px] bg-[#1F1F23]" />
			</div>
		);
	}

	// Show the summary view by default when an application exists. Only
	// flip to the editable form when the user explicitly clicks Edit (and
	// the application is still in 'submitted' state — review-locked
	// applications never get an Edit affordance).
	if (hasApplication && !isEditMode && existingApplication) {
		return (
			<SubmissionSummary
				application={{
					status: applicationStatus ?? "submitted",
					submittedAt: existingApplication.submittedAt,
					name: existingApplication.name,
					email: existingApplication.email,
					motivation: existingApplication.motivation,
					commitment: existingApplication.commitment,
					ideas: existingApplication.ideas ?? "",
				}}
				profile={{
					whatsapp: profile?.whatsapp ?? "",
					github: profile?.github ?? "",
					linkedin: profile?.linkedin ?? "",
					portfolio: profile?.portfolio ?? "",
					skills: profile?.skills ?? "",
					experience: profile?.experience ?? "",
				}}
				onEdit={canEdit ? handleEnterEdit : undefined}
			/>
		);
	}

	const submitButtonLabel = isSubmitting
		? isEditingSubmitted
			? "Saving..."
			: "Submitting..."
		: isEditingSubmitted
			? "Save changes"
			: "Submit Application";

	return (
		<div>
			{/* Header */}
			<div className="mb-8">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
						Founding Member Application
					</h1>
					{!isEditingSubmitted && (
						<span className="rounded-[4px] border border-[#1F1F23] bg-[#111113] px-2 py-1 text-xs text-[#71717A]">
							Limited spots available
						</span>
					)}
				</div>
			</div>

			{isEditingSubmitted && existingApplication && (
				<EditableNotice submittedAt={existingApplication.submittedAt} />
			)}

			{/* Form */}
			<form onSubmit={handleSubmit} className="space-y-10" noValidate>
				{/* Personal Information */}
				<fieldset className="space-y-5">
					<SectionHeader>Personal Information</SectionHeader>

					<div>
						<FieldLabel htmlFor="name">Full Name</FieldLabel>
						<input
							id="name"
							name="name"
							type="text"
							autoComplete="name"
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
							name="email"
							type="email"
							autoComplete="email"
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
							name="phone"
							type="tel"
							autoComplete="tel"
							inputMode="tel"
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
								name="github"
								type="url"
								autoComplete="url"
								inputMode="url"
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
								name="linkedin"
								type="url"
								autoComplete="url"
								inputMode="url"
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
							name="portfolio"
							type="url"
							autoComplete="url"
							inputMode="url"
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

				{/* Newsletter opt-in */}
				<button
					type="button"
					onClick={() => updateField("newsletter", !formData.newsletter)}
					className={cn(
						"flex w-full items-start gap-3 rounded-card border bg-[#111113] px-4 py-3 text-left transition-colors",
						formData.newsletter
							? "border-[#F59E0B]/40 hover:border-[#F59E0B]/60"
							: "border-[#1F1F23] hover:border-[#2f2f35]",
					)}
				>
					<Checkbox
						checked={formData.newsletter}
						onCheckedChange={(v) => updateField("newsletter", v)}
						tabIndex={-1}
						className="mt-0.5"
					/>
					<div className="min-w-0">
						<p className="text-sm font-medium text-[#FAFAFA]">
							Send me the community newsletter
						</p>
						<p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">
							Occasional updates from CodeBhaav  what we're building, what
							members are shipping. Unsubscribe anytime from your dashboard.
						</p>
					</div>
				</button>

				{/* Legal + Submit */}
				<div className="space-y-4">
					{!isEditingSubmitted && (
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
					)}

					{savedAt && (
						<div className="rounded-[6px] border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#86efac]">
							{isEditingSubmitted ? "Changes saved." : "Application submitted."}
						</div>
					)}

					{submitError && (
						<div className="rounded-[6px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
							{submitError}
						</div>
					)}

					<div className="flex flex-wrap gap-3">
						<button
							type="submit"
							disabled={isSubmitting}
							className="inline-flex h-11 w-full items-center justify-center rounded-button bg-gradient-to-b from-[#F59E0B] to-[#D97706] px-6 text-sm font-semibold text-[#1a1208] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-[#D97706] transition-all hover:from-[#FBBF24] hover:to-[#F59E0B] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
						>
							{submitButtonLabel}
						</button>
						{isEditingSubmitted && (
							<button
								type="button"
								onClick={handleCancelEdit}
								disabled={isSubmitting}
								className="inline-flex h-11 w-full items-center justify-center rounded-button border border-[#1F1F23] bg-[#0a0a0a] px-6 text-sm font-medium text-[#a1a1aa] transition-colors hover:border-[#52525b] hover:text-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
							>
								Cancel
							</button>
						)}
					</div>
				</div>
			</form>
		</div>
	);
}
