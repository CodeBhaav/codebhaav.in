import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import {
	ArrowLeft,
	Check,
	Crown,
	ExternalLink,
	Hammer,
	Plus,
	Rocket,
	Trash2,
	UserCheck,
	X,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
	Avatar,
	PageHeader,
	Panel,
	formatRelative,
} from "./AdminOverview";

type Status = "open" | "building" | "shipped";

interface Props {
	slug: string;
}

export function AdminProjectDetail({ slug }: Props) {
	const { user } = useUser();
	const pub = useQuery(
		api.projects.getProjectBySlug,
		user ? { slug } : "skip",
	);
	const project = useQuery(
		api.projects.getProjectForAdmin,
		user && pub ? { projectId: pub.id as Id<"project"> } : "skip",
	);

	const flipStatus = useMutation(api.projects.flipProjectStatus);
	const updateProject = useMutation(api.projects.updateProject);
	const addTeamMember = useMutation(api.projects.addBuildTeamMember);
	const removeTeamMember = useMutation(api.projects.removeBuildTeamMember);
	const updateRole = useMutation(api.projects.updateBuildMemberRole);
	const setTeamLead = useMutation(api.projects.setProjectTeamLead);

	const [editing, setEditing] = useState(false);
	const [draftTitle, setDraftTitle] = useState("");
	const [draftDescription, setDraftDescription] = useState("");
	const [draftTech, setDraftTech] = useState<string[]>([]);
	const [techInput, setTechInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pendingFlip, setPendingFlip] = useState(false);
	const [pendingMember, setPendingMember] = useState<string | null>(null);
	const [pendingMemberRole, setPendingMemberRole] = useState<string | null>(
		null,
	);
	const [memberRoleInput, setMemberRoleInput] = useState<
		Record<string, string>
	>({});

	useEffect(() => {
		if (!project) return;
		setDraftTitle(project.title);
		setDraftDescription(project.description);
		setDraftTech(project.techStack);
	}, [project?.id]);

	if (pub === undefined || project === undefined) return <LoadingState />;
	if (pub === null || project === null) return <NotFound />;

	const projectId = project.id as Id<"project">;

	const handleFlip = async (status: Status) => {
		if (status === project.status) return;
		setPendingFlip(true);
		setError(null);
		try {
			await flipStatus({ projectId, status });
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed");
		} finally {
			setPendingFlip(false);
		}
	};

	const handleSaveEdits = async () => {
		setError(null);
		try {
			await updateProject({
				projectId,
				title: draftTitle.trim(),
				description: draftDescription.trim(),
				techStack: draftTech,
			});
			setEditing(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to save");
		}
	};

	const handleAddMember = async (clerkUserId: string) => {
		const role = (memberRoleInput[clerkUserId] ?? "").trim();
		if (!role) {
			setError("Pick a role first");
			return;
		}
		setPendingMember(clerkUserId);
		setError(null);
		try {
			await addTeamMember({ projectId, clerkUserId, role });
			setMemberRoleInput((m) => {
				const next = { ...m };
				delete next[clerkUserId];
				return next;
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to add");
		} finally {
			setPendingMember(null);
		}
	};

	const handleUpdateRole = async (memberId: string, role: string) => {
		setPendingMemberRole(memberId);
		try {
			await updateRole({
				memberId: memberId as Id<"projectBuildTeamMember">,
				role: role.trim(),
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to update");
		} finally {
			setPendingMemberRole(null);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		if (!confirm("Remove this member from the build team?")) return;
		setPendingMember(memberId);
		try {
			await removeTeamMember({
				memberId: memberId as Id<"projectBuildTeamMember">,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to remove");
		} finally {
			setPendingMember(null);
		}
	};

	// One-click: add a volunteer to the team AND promote them to team lead.
	const handleAddAsLead = async (clerkUserId: string) => {
		const role = (memberRoleInput[clerkUserId] ?? "").trim() || "Team Lead";
		setPendingMember(clerkUserId);
		setError(null);
		try {
			await addTeamMember({ projectId, clerkUserId, role });
			await setTeamLead({ projectId, clerkUserId });
			setMemberRoleInput((m) => {
				const next = { ...m };
				delete next[clerkUserId];
				return next;
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to set lead");
		} finally {
			setPendingMember(null);
		}
	};

	const addTech = () => {
		const t = techInput.trim();
		if (!t || draftTech.includes(t) || draftTech.length >= 12) return;
		setDraftTech((s) => [...s, t]);
		setTechInput("");
	};

	return (
		<div className="space-y-6">
			<a
				href="/admin/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>

			<PageHeader
				eyebrow="Admin · Project"
				title={project.title}
				subtitle={
					project.originatorName
						? `Idea by ${project.originatorName}`
						: undefined
				}
				actions={
					<a
						href={`/projects/${project.slug}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-9 items-center gap-1.5 rounded-button border border-border bg-card px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						<ExternalLink className="size-3.5" aria-hidden />
						View public page
					</a>
				}
			/>

			{error && (
				<div className="rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
					{error}
				</div>
			)}

			<Panel>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Status
						</p>
						<p className="mt-1 text-xs text-text-secondary">
							Flip to "building" once the team is assembled. Flip to "shipped"
							when it goes live.
						</p>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{(["open", "building", "shipped"] as Status[]).map((s) => (
							<button
								key={s}
								type="button"
								disabled={pendingFlip || s === project.status}
								onClick={() => handleFlip(s)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-button border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed",
									s === project.status
										? "border-accent/40 bg-accent/10 text-accent"
										: "border-border bg-background text-text-secondary hover:border-border-hover hover:text-text-primary",
								)}
							>
								{s === "building" && <Hammer className="size-3" aria-hidden />}
								{s === "shipped" && <Rocket className="size-3" aria-hidden />}
								{s}
							</button>
						))}
					</div>
				</div>
			</Panel>

			<Panel>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Details
						</p>
					</div>
					{!editing ? (
						<button
							type="button"
							onClick={() => setEditing(true)}
							className="inline-flex h-8 items-center rounded-button border border-border bg-background px-3 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
						>
							Edit
						</button>
					) : (
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => {
									setEditing(false);
									setDraftTitle(project.title);
									setDraftDescription(project.description);
									setDraftTech(project.techStack);
								}}
								className="inline-flex h-8 items-center rounded-button border border-border bg-background px-3 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSaveEdits}
								className="inline-flex h-8 items-center rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover"
							>
								Save
							</button>
						</div>
					)}
				</div>
				{!editing ? (
					<div className="mt-4 space-y-4">
						<h2 className="text-xl font-semibold text-text-primary leading-tight">
							{project.title}
						</h2>
						<p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
							{project.description}
						</p>
						{project.techStack.length > 0 && (
							<div>
								<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
									Tech stack
								</p>
								<div className="mt-1.5 flex flex-wrap gap-1.5">
									{project.techStack.map((t) => (
										<span
											key={t}
											className="inline-flex items-center rounded-[4px] border border-border bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-text-secondary"
										>
											{t}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="mt-4 space-y-4">
						<label className="block">
							<span className="text-xs font-medium text-text-secondary">
								Title
							</span>
							<input
								type="text"
								value={draftTitle}
								onChange={(e) => setDraftTitle(e.target.value)}
								maxLength={140}
								className="mt-1.5 w-full rounded-button border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
							/>
						</label>
						<label className="block">
							<span className="text-xs font-medium text-text-secondary">
								Description
							</span>
							<textarea
								value={draftDescription}
								onChange={(e) => setDraftDescription(e.target.value)}
								rows={6}
								maxLength={4000}
								className="mt-1.5 w-full resize-y rounded-button border border-border bg-background px-3 py-2 text-sm leading-relaxed text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
							/>
						</label>
						<div>
							<span className="text-xs font-medium text-text-secondary">
								Tech stack
							</span>
							<div className="mt-1.5 flex gap-2">
								<input
									type="text"
									value={techInput}
									onChange={(e) => setTechInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTech();
										}
									}}
									placeholder="React, Convex, Postgres…"
									className="h-9 flex-1 rounded-button border border-border bg-background px-3 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
								/>
								<button
									type="button"
									onClick={addTech}
									className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-3 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
								>
									Add
								</button>
							</div>
							{draftTech.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1.5">
									{draftTech.map((t) => (
										<button
											key={t}
											type="button"
											onClick={() =>
												setDraftTech((s) => s.filter((x) => x !== t))
											}
											className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-rose-500/40 hover:text-rose-300"
										>
											{t}
											<X className="size-3" aria-hidden />
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				)}
			</Panel>

			<Panel>
				<header>
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Build team ({project.team.length})
					</p>
					<p className="mt-1 text-xs text-text-secondary">
						Members officially building this. Edit roles or remove members
						anytime.
					</p>
				</header>
				{project.team.length === 0 ? (
					<p className="mt-4 rounded-[6px] border border-dashed border-border bg-background/40 px-4 py-6 text-center text-sm text-text-muted">
						No build team yet. Pick volunteers from the list below.
					</p>
				) : (
					<ul className="mt-4 space-y-2">
						{project.team.map((m) => {
							const isPending =
								pendingMember === m.id ||
								pendingMemberRole === m.id;
							return (
								<li
									key={m.id}
									className="flex flex-wrap items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5"
								>
									<Avatar name={m.userName} size={32} />
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-text-primary">
											{m.userName}
											{m.clerkUserId === project.teamLeadClerkUserId && (
												<span className="ml-2 inline-flex items-center gap-1 rounded-[4px] border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
													<Crown className="size-2.5" aria-hidden />
													Lead
												</span>
											)}
										</p>
										<p className="truncate font-mono text-[11px] text-text-muted">
											{m.userEmail || "—"}
										</p>
									</div>
									<RoleEditor
										initial={m.role}
										disabled={isPending}
										onCommit={(role) => handleUpdateRole(m.id, role)}
									/>
									<button
										type="button"
										onClick={async () => {
											try {
												await setTeamLead({
													projectId,
													clerkUserId:
														m.clerkUserId === project.teamLeadClerkUserId
															? null
															: m.clerkUserId,
												});
											} catch (e) {
												setError(
													e instanceof Error ? e.message : "Failed",
												);
											}
										}}
										title={
											m.clerkUserId === project.teamLeadClerkUserId
												? "Demote team lead"
												: "Make team lead"
										}
										className={cn(
											"inline-flex size-8 items-center justify-center rounded-button transition-colors",
											m.clerkUserId === project.teamLeadClerkUserId
												? "text-amber-300 hover:bg-amber-500/10"
												: "text-text-muted hover:bg-amber-500/10 hover:text-amber-300",
										)}
									>
										<Crown className="size-3.5" aria-hidden />
									</button>
									<button
										type="button"
										onClick={() => handleRemoveMember(m.id)}
										disabled={isPending}
										title="Remove from team"
										className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
									>
										<Trash2 className="size-3.5" aria-hidden />
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</Panel>

			<Panel>
				<header>
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Volunteers ({project.volunteers.length})
					</p>
					<p className="mt-1 text-xs text-text-secondary">
						Members who clicked "I wanna build this". Type a role (e.g.{" "}
						<span className="font-mono">Backend</span>,{" "}
						<span className="font-mono">Designer</span>) then{" "}
						<strong className="text-text-primary">Add</strong>  or click{" "}
						<strong className="text-amber-300">Make lead</strong> to add them
						AND designate them as the project's team lead in one click.
					</p>
				</header>
				{project.volunteers.length === 0 ? (
					<p className="mt-4 rounded-[6px] border border-dashed border-border bg-background/40 px-4 py-6 text-center text-sm text-text-muted">
						No volunteers yet.
					</p>
				) : (
					<ul className="mt-4 space-y-2">
						{project.volunteers.map((v) => (
							<li
								key={v.clerkUserId}
								className="flex flex-wrap items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5"
							>
								<Avatar name={v.userName} size={32} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-text-primary">
										{v.userName}
									</p>
									<p className="truncate font-mono text-[11px] text-text-muted">
										{v.userEmail || "—"} · volunteered{" "}
										{formatRelative(v.interestedAt)}
									</p>
								</div>
								{v.onTeam ? (
									<span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
										<UserCheck className="size-3" aria-hidden />
										On team
									</span>
								) : (
									<>
										<input
											type="text"
											placeholder="Role (e.g. Backend)"
											value={memberRoleInput[v.clerkUserId] ?? ""}
											onChange={(e) =>
												setMemberRoleInput((m) => ({
													...m,
													[v.clerkUserId]: e.target.value,
												}))
											}
											className="h-8 w-40 rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
										/>
										<button
											type="button"
											disabled={pendingMember === v.clerkUserId}
											onClick={() => handleAddMember(v.clerkUserId)}
											title="Add to team with the role above"
											className="inline-flex h-8 items-center gap-1 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
										>
											<Plus className="size-3" aria-hidden />
											Add
										</button>
										<button
											type="button"
											disabled={pendingMember === v.clerkUserId}
											onClick={() => handleAddAsLead(v.clerkUserId)}
											title="Add to team AND make team lead in one click"
											className="inline-flex h-8 items-center gap-1 rounded-button border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<Crown className="size-3" aria-hidden />
											Make lead
										</button>
									</>
								)}
							</li>
						))}
					</ul>
				)}
			</Panel>
		</div>
	);
}

function RoleEditor({
	initial,
	onCommit,
	disabled,
}: {
	initial: string;
	onCommit: (role: string) => void;
	disabled?: boolean;
}) {
	const [value, setValue] = useState(initial);
	useEffect(() => setValue(initial), [initial]);
	const dirty = value.trim() !== initial.trim();
	return (
		<div className="flex items-center gap-1.5">
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				disabled={disabled}
				className="h-8 w-40 rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
			/>
			{dirty && (
				<button
					type="button"
					onClick={() => onCommit(value)}
					disabled={disabled || !value.trim()}
					title="Save role"
					className="inline-flex size-8 items-center justify-center rounded-button border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
				>
					<Check className="size-3.5" aria-hidden />
				</button>
			)}
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-3 w-32 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-12 w-72 animate-pulse rounded-[4px] bg-surface" />
			<div className="h-24 animate-pulse rounded-card bg-surface" />
			<div className="h-72 animate-pulse rounded-card bg-surface" />
			<div className="h-48 animate-pulse rounded-card bg-surface" />
		</div>
	);
}

function NotFound() {
	return (
		<div className="space-y-6">
			<a
				href="/admin/projects"
				className="inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to projects
			</a>
			<Panel>
				<p className="text-sm font-medium text-text-primary">
					Project not found.
				</p>
			</Panel>
		</div>
	);
}
