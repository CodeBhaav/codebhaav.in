import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import {
	ArrowLeft,
	ExternalLink,
	Github,
	Globe,
	Linkedin,
	Mail,
	MessageCircle,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
	Avatar,
	Panel,
	StatusPill,
	formatRelative,
} from "./AdminOverview";

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
	submitted: "Submitted",
	in_review: "In review",
	accepted: "Accepted",
	rejected: "Rejected",
};

const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
	submitted: "Initial state. Applicant can still edit.",
	in_review: "Reviewing. No email sent. Edits locked.",
	accepted: "Sends acceptance email with dashboard CTA.",
	rejected: "Sends rejection email reaffirming waitlist place.",
};

const STATUS_ORDER: ApplicationStatus[] = [
	"submitted",
	"in_review",
	"accepted",
	"rejected",
];

export function FoundingMemberDetail({
	applicationId,
}: {
	applicationId: Id<"foundingMember">;
}) {
	const { user } = useUser();
	const app = useQuery(
		api.admin.getFoundingMember,
		user ? { applicationId } : "skip",
	);
	const flipStatus = useMutation(api.admin.flipFoundingStatus);

	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!user || app === undefined) {
		return <LoadingState />;
	}

	if (app === null) {
		return <NotFound />;
	}

	const handleFlip = async (newStatus: ApplicationStatus) => {
		if (newStatus === app.status) return;
		setError(null);
		setPending(true);
		try {
			await flipStatus({ applicationId, status: newStatus });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update status");
		} finally {
			setPending(false);
		}
	};

	const submittedDate = new Date(app.submittedAt);

	return (
		<div className="space-y-6">
			<a
				href="/admin/founding-members"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to applications
			</a>

			<header className="flex flex-wrap items-start gap-5">
				<Avatar name={app.name} size={64} />
				<div className="flex-1 min-w-0">
					<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						Admin · Founding Member
					</p>
					<h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary truncate">
						{app.name}
					</h1>
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
						<a
							href={`mailto:${app.email}`}
							className="inline-flex items-center gap-1.5 transition-colors hover:text-text-primary"
						>
							<Mail className="size-3.5" aria-hidden />
							{app.email}
						</a>
						<span className="font-mono">
							Submitted {formatRelative(app.submittedAt)} ·{" "}
							{submittedDate.toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</span>
					</div>
				</div>
				<div className="shrink-0">
					<StatusPill status={app.status} size="md" />
				</div>
			</header>

			<Panel>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Set status
						</p>
						<p className="mt-1 text-xs text-text-secondary">
							{STATUS_DESCRIPTIONS[app.status]}
						</p>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{STATUS_ORDER.map((s) => (
							<StatusFlipButton
								key={s}
								status={s}
								current={app.status}
								disabled={pending}
								onClick={() => handleFlip(s)}
							/>
						))}
					</div>
				</div>
				{pending && (
					<p className="mt-3 font-mono text-[11px] text-text-muted">saving…</p>
				)}
				{error && (
					<p className="mt-3 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
						{error}
					</p>
				)}
			</Panel>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Panel className="lg:col-span-1">
					<SectionTitle>Contact</SectionTitle>
					<dl className="mt-4 space-y-3">
						<ContactRow
							icon={<MessageCircle className="size-3.5" aria-hidden />}
							label="WhatsApp"
							value={app.profile.whatsapp}
							href={
								app.profile.whatsapp
									? `https://wa.me/${app.profile.whatsapp.replace(/\D/g, "")}`
									: undefined
							}
						/>
						<ContactRow
							icon={<Github className="size-3.5" aria-hidden />}
							label="GitHub"
							value={app.profile.github}
							href={app.profile.github ? toUrl(app.profile.github) : undefined}
						/>
						<ContactRow
							icon={<Linkedin className="size-3.5" aria-hidden />}
							label="LinkedIn"
							value={app.profile.linkedin}
							href={
								app.profile.linkedin ? toUrl(app.profile.linkedin) : undefined
							}
						/>
						<ContactRow
							icon={<Globe className="size-3.5" aria-hidden />}
							label="Portfolio"
							value={app.profile.portfolio}
							href={
								app.profile.portfolio ? toUrl(app.profile.portfolio) : undefined
							}
						/>
					</dl>
				</Panel>

				<Panel className="lg:col-span-2">
					<SectionTitle>Skills & Experience</SectionTitle>
					<div className="mt-4 space-y-5">
						<SubsectionBlock
							label="Skills"
							body={app.profile.skills}
							empty="No skills listed."
						/>
						<SubsectionBlock
							label="Experience"
							body={app.profile.experience}
							empty="No experience listed."
						/>
					</div>
				</Panel>
			</div>

			<Panel>
				<SectionTitle>Motivation</SectionTitle>
				<Prose className="mt-3">{app.motivation || "—"}</Prose>
			</Panel>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Panel>
					<SectionTitle>Commitment</SectionTitle>
					<Prose className="mt-3">{app.commitment || "—"}</Prose>
				</Panel>
				<Panel>
					<SectionTitle>Ideas</SectionTitle>
					<Prose className="mt-3">{app.ideas || "—"}</Prose>
				</Panel>
			</div>
		</div>
	);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
			{children}
		</p>
	);
}

function SubsectionBlock({
	label,
	body,
	empty,
}: {
	label: string;
	body: string;
	empty: string;
}) {
	return (
		<div>
			<p className="text-xs font-medium text-text-secondary">{label}</p>
			<Prose className="mt-1.5">{body || empty}</Prose>
		</div>
	);
}

function Prose({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				"whitespace-pre-wrap text-sm leading-relaxed text-text-secondary",
				className,
			)}
		>
			{children}
		</p>
	);
}

function ContactRow({
	icon,
	label,
	value,
	href,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	href?: string;
}) {
	const empty = !value;
	const inner = (
		<div className="flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5 transition-colors group-hover:border-border-hover group-hover:bg-surface/40">
			<div className="flex items-center gap-2 min-w-0">
				<span className="text-text-muted">{icon}</span>
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						{label}
					</p>
					<p
						className={cn(
							"mt-0.5 truncate text-xs",
							empty ? "text-text-muted" : "text-text-primary",
						)}
					>
						{empty ? "—" : value}
					</p>
				</div>
			</div>
			{href && !empty && (
				<ExternalLink
					className="size-3.5 shrink-0 text-text-muted transition-colors group-hover:text-accent"
					aria-hidden
				/>
			)}
		</div>
	);
	if (href && !empty) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className="group block"
			>
				{inner}
			</a>
		);
	}
	return <div className="group">{inner}</div>;
}

function StatusFlipButton({
	status,
	current,
	disabled,
	onClick,
}: {
	status: ApplicationStatus;
	current: ApplicationStatus;
	disabled?: boolean;
	onClick: () => void;
}) {
	const isCurrent = status === current;
	const palette: Record<ApplicationStatus, string> = {
		submitted:
			"hover:border-zinc-400/50 hover:text-zinc-200 hover:bg-zinc-500/10",
		in_review:
			"hover:border-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10",
		accepted:
			"hover:border-emerald-500/50 hover:text-emerald-300 hover:bg-emerald-500/10",
		rejected:
			"hover:border-rose-500/50 hover:text-rose-300 hover:bg-rose-500/10",
	};
	return (
		<button
			type="button"
			disabled={disabled || isCurrent}
			onClick={onClick}
			className={cn(
				"inline-flex items-center rounded-button border border-border bg-background px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-background disabled:hover:text-text-secondary",
				!isCurrent && palette[status],
				isCurrent && "ring-1 ring-accent/30 text-accent",
			)}
		>
			{STATUS_LABELS[status]}
		</button>
	);
}

function toUrl(value: string): string {
	if (/^https?:\/\//i.test(value)) return value;
	if (/^[\w-]+\/[\w.-]+$/.test(value)) return `https://github.com/${value}`;
	if (/^@/.test(value)) return `https://github.com/${value.slice(1)}`;
	return `https://${value.replace(/^\/+/, "")}`;
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="flex items-start gap-5">
				<div className="size-16 animate-pulse rounded-full bg-surface" />
				<div className="flex-1 space-y-2">
					<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
					<div className="h-9 w-72 animate-pulse rounded-[4px] bg-surface" />
					<div className="h-3 w-56 animate-pulse rounded-[4px] bg-surface/60" />
				</div>
			</div>
			<div className="h-20 animate-pulse rounded-card bg-surface" />
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="h-64 animate-pulse rounded-card bg-surface" />
				<div className="lg:col-span-2 h-64 animate-pulse rounded-card bg-surface" />
			</div>
			<div className="h-40 animate-pulse rounded-card bg-surface" />
		</div>
	);
}

function NotFound() {
	return (
		<div className="space-y-6">
			<a
				href="/admin/founding-members"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to applications
			</a>
			<Panel>
				<p className="text-sm font-medium text-text-primary">
					Application not found.
				</p>
				<p className="mt-1 text-xs text-text-muted">
					This application may have been removed or the URL is invalid.
				</p>
			</Panel>
		</div>
	);
}
