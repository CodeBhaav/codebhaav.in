import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { Crown, Plus, Trash2, UserCheck, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, formatRelative } from "../admin/AdminOverview";
import type { TeamMemberSummary, VolunteerSummary } from "./BuildTeamCard";

interface Props {
	projectId: string;
	team: TeamMemberSummary[];
	volunteers: VolunteerSummary[];
	teamLeadClerkUserId: string | null;
	isAdmin: boolean;
	onClose: () => void;
}

export function ManageTeamModal({
	projectId,
	team,
	volunteers,
	teamLeadClerkUserId,
	isAdmin,
	onClose,
}: Props) {
	const addMember = useMutation(api.projects.addBuildTeamMember);
	const removeMember = useMutation(api.projects.removeBuildTeamMember);
	const updateRole = useMutation(api.projects.updateBuildMemberRole);
	const setTeamLead = useMutation(api.projects.setProjectTeamLead);

	const [error, setError] = useState<string | null>(null);
	const [pendingMember, setPendingMember] = useState<string | null>(null);
	const [roleInput, setRoleInput] = useState<Record<string, string>>({});

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleAdd = async (clerkUserId: string) => {
		const role = (roleInput[clerkUserId] ?? "").trim();
		if (!role) {
			setError("Pick a role first");
			return;
		}
		setPendingMember(clerkUserId);
		setError(null);
		try {
			await addMember({
				projectId: projectId as Id<"project">,
				clerkUserId,
				role,
			});
			setRoleInput((m) => {
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

	const handleRemove = async (memberId: string) => {
		if (!confirm("Remove this member from the build team?")) return;
		setPendingMember(memberId);
		try {
			await removeMember({
				memberId: memberId as Id<"projectBuildTeamMember">,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to remove");
		} finally {
			setPendingMember(null);
		}
	};

	const handleRoleSave = async (memberId: string, role: string) => {
		try {
			await updateRole({
				memberId: memberId as Id<"projectBuildTeamMember">,
				role: role.trim(),
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to save role");
		}
	};

	const handleSetLead = async (clerkUserId: string | null) => {
		setError(null);
		try {
			await setTeamLead({
				projectId: projectId as Id<"project">,
				clerkUserId,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to assign lead");
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-card border border-border bg-card shadow-2xl flex flex-col">
				<header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
							Manage build team
						</p>
						<h2 className="mt-0.5 text-lg font-semibold tracking-tight text-text-primary">
							Members & volunteers
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
					>
						<X className="size-4" aria-hidden />
					</button>
				</header>

				<div className="overflow-y-auto px-6 py-5 space-y-6">
					{error && (
						<div className="rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
							{error}
						</div>
					)}

					{/* Build Team */}
					<section>
						<header>
							<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
								Team ({team.length})
							</p>
						</header>
						{team.length === 0 ? (
							<p className="mt-3 text-sm text-text-muted">
								No team members yet. Add volunteers from the list below.
							</p>
						) : (
							<ul className="mt-3 space-y-2">
								{team.map((m) => {
									const isLead = m.clerkUserId === teamLeadClerkUserId;
									return (
										<li
											key={m.id}
											className="flex flex-wrap items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2.5"
										>
											<Avatar name={m.userName} size={32} />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium text-text-primary">
													{m.userName}
													{isLead && (
														<span className="ml-2 inline-flex items-center gap-1 rounded-[4px] border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300">
															<Crown className="size-2.5" aria-hidden />
															Lead
														</span>
													)}
												</p>
												<p className="truncate font-mono text-[11px] text-text-muted">
													{m.userEmail || ""}
												</p>
											</div>
											<RoleEditor
												initial={m.role}
												onCommit={(r) => handleRoleSave(m.id, r)}
											/>
											{isAdmin && !isLead && (
												<button
													type="button"
													onClick={() => handleSetLead(m.clerkUserId)}
													title="Make team lead"
													className="inline-flex size-8 items-center justify-center rounded-button text-text-muted transition-colors hover:bg-amber-500/10 hover:text-amber-300"
												>
													<Crown className="size-3.5" aria-hidden />
												</button>
											)}
											{isAdmin && isLead && (
												<button
													type="button"
													onClick={() => handleSetLead(null)}
													title="Demote team lead"
													className="inline-flex size-8 items-center justify-center rounded-button text-amber-300 transition-colors hover:bg-amber-500/10"
												>
													<Crown className="size-3.5" aria-hidden />
												</button>
											)}
											<button
												type="button"
												disabled={pendingMember === m.id}
												onClick={() => handleRemove(m.id)}
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
					</section>

					{/* Volunteers */}
					<section>
						<header>
							<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
								Volunteers ({volunteers.length})
							</p>
							<p className="mt-1 text-xs text-text-muted">
								People who clicked "I wanna build this". Reach out off-platform,
								then add the ones you pick.
							</p>
						</header>
						{volunteers.length === 0 ? (
							<p className="mt-3 text-sm text-text-muted">
								No volunteers yet.
							</p>
						) : (
							<ul className="mt-3 space-y-2">
								{volunteers.map((v) => (
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
												{v.userEmail || ""} · volunteered{" "}
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
													placeholder="Role"
													value={roleInput[v.clerkUserId] ?? ""}
													onChange={(e) =>
														setRoleInput((m) => ({
															...m,
															[v.clerkUserId]: e.target.value,
														}))
													}
													className="h-8 w-36 rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
												/>
												<button
													type="button"
													disabled={pendingMember === v.clerkUserId}
													onClick={() => handleAdd(v.clerkUserId)}
													className="inline-flex h-8 items-center gap-1 rounded-button bg-accent px-3 text-xs font-semibold text-[#1a1208] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
												>
													<Plus className="size-3" aria-hidden />
													Add
												</button>
											</>
										)}
									</li>
								))}
							</ul>
						)}
					</section>
				</div>

				<footer className="border-t border-border px-6 py-3 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-9 items-center rounded-button border border-border bg-background px-3.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
					>
						Done
					</button>
				</footer>
			</div>
		</div>
	);
}

function RoleEditor({
	initial,
	onCommit,
}: {
	initial: string;
	onCommit: (role: string) => void;
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
				className="h-8 w-32 rounded-button border border-border bg-background px-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
			/>
			{dirty && (
				<button
					type="button"
					onClick={() => onCommit(value)}
					disabled={!value.trim()}
					title="Save role"
					className={cn(
						"inline-flex size-8 items-center justify-center rounded-button border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 transition-colors hover:bg-emerald-500/20",
						!value.trim() && "opacity-40 cursor-not-allowed",
					)}
				>
					✓
				</button>
			)}
		</div>
	);
}
