import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Check, ExternalLink, Github, Globe, Pencil } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface Props {
	projectId: string;
	repoUrl: string | null;
	demoUrl: string | null;
	canEdit: boolean;
}

export function ProjectLinksCard({
	projectId,
	repoUrl,
	demoUrl,
	canEdit,
}: Props) {
	const updateProject = useMutation(api.projects.updateProject);
	const [editing, setEditing] = useState(false);
	const [repoDraft, setRepoDraft] = useState(repoUrl ?? "");
	const [demoDraft, setDemoDraft] = useState(demoUrl ?? "");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keep local drafts aligned with upstream data when we're not editing.
	useEffect(() => {
		if (!editing) {
			setRepoDraft(repoUrl ?? "");
			setDemoDraft(demoUrl ?? "");
		}
	}, [editing, repoUrl, demoUrl]);

	const empty = !repoUrl && !demoUrl;

	if (!canEdit && empty) return null;

	const save = async () => {
		setPending(true);
		setError(null);
		try {
			await updateProject({
				projectId: projectId as Id<"project">,
				repoUrl: repoDraft.trim(),
				demoUrl: demoDraft.trim(),
			});
			setEditing(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to save");
		} finally {
			setPending(false);
		}
	};

	const cancel = () => {
		setRepoDraft(repoUrl ?? "");
		setDemoDraft(demoUrl ?? "");
		setError(null);
		setEditing(false);
	};

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<header className="flex items-center justify-between gap-2">
				<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
					Links
				</p>
				{canEdit && !editing && (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
					>
						<Pencil className="size-3" aria-hidden />
						{empty ? "Add" : "Edit"}
					</button>
				)}
			</header>

			{!editing ? (
				empty ? (
					<EmptyState
						canEdit={canEdit}
						onEdit={() => setEditing(true)}
					/>
				) : (
					<div className="mt-3 space-y-2">
						{repoUrl && (
							<LinkRow
								href={repoUrl}
								label="Repository"
								icon={<Github className="size-3.5" aria-hidden />}
							/>
						)}
						{demoUrl && (
							<LinkRow
								href={demoUrl}
								label="Live demo"
								icon={<Globe className="size-3.5" aria-hidden />}
							/>
						)}
					</div>
				)
			) : (
				<div className="mt-3 space-y-3">
					<UrlField
						label="Repository"
						icon={<Github className="size-3.5" aria-hidden />}
						value={repoDraft}
						onChange={setRepoDraft}
						placeholder="https://github.com/org/repo"
					/>
					<UrlField
						label="Live demo"
						icon={<Globe className="size-3.5" aria-hidden />}
						value={demoDraft}
						onChange={setDemoDraft}
						placeholder="https://yourapp.com"
					/>
					<p className="text-[11px] text-text-muted">
						Leave blank to remove. Must start with <code className="font-mono text-text-secondary">https://</code>.
					</p>
					{error && (
						<p className="text-[11px] text-rose-300" role="alert">
							{error}
						</p>
					)}
					<div className="flex items-center justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={cancel}
							className="font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
						>
							Cancel
						</button>
						<button
							type="button"
							disabled={pending}
							onClick={save}
							className={cn(
								"inline-flex h-8 items-center gap-1 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover",
								pending && "opacity-50 cursor-not-allowed",
							)}
						>
							<Check className="size-3.5" aria-hidden />
							{pending ? "Saving" : "Save"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function LinkRow({
	href,
	label,
	icon,
}: {
	href: string;
	label: string;
	icon: React.ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex items-center gap-2 rounded-button border border-border bg-surface/40 px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
		>
			<span className="text-text-muted group-hover:text-accent">{icon}</span>
			<span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
				{label}
			</span>
			<span className="ml-auto inline-flex items-center gap-1 truncate">
				<span className="truncate font-mono text-[11px]">
					{prettyHost(href)}
				</span>
				<ExternalLink className="size-3 shrink-0 text-text-muted group-hover:text-text-secondary" aria-hidden />
			</span>
		</a>
	);
}

function UrlField({
	label,
	icon,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	icon: React.ReactNode;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	return (
		<label className="block space-y-1.5">
			<span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
				{icon}
				{label}
			</span>
			<input
				type="url"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="h-8 w-full rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
			/>
		</label>
	);
}

function EmptyState({
	canEdit,
	onEdit,
}: {
	canEdit: boolean;
	onEdit: () => void;
}) {
	return (
		<div className="mt-3">
			<p className="text-sm text-text-secondary">No links yet.</p>
			<p className="mt-1 text-xs text-text-muted leading-relaxed">
				Once you have a repo or a live build, drop the URLs here so the
				community can dig in.
			</p>
			{canEdit && (
				<button
					type="button"
					onClick={onEdit}
					className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-accent hover:text-accent-hover"
				>
					<Pencil className="size-3" aria-hidden />
					Add links
				</button>
			)}
		</div>
	);
}

function prettyHost(url: string): string {
	try {
		const u = new URL(url);
		const host = u.hostname.replace(/^www\./, "");
		const path = u.pathname.replace(/\/$/, "");
		return path && path !== "" ? `${host}${path}` : host;
	} catch {
		return url;
	}
}
