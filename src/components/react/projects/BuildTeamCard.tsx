import { useState } from "react";
import { Settings2, Users } from "lucide-react";
import { Avatar } from "../admin/AdminOverview";
import { ManageTeamModal } from "./ManageTeamModal";

export interface TeamMemberSummary {
	id: string;
	clerkUserId: string;
	userName: string;
	userEmail: string;
	role: string;
}

export interface VolunteerSummary {
	clerkUserId: string;
	userName: string;
	userEmail: string;
	interestedAt: number;
	onTeam: boolean;
}

interface Props {
	projectId: string;
	team: TeamMemberSummary[];
	volunteers: VolunteerSummary[] | null;
	teamLeadClerkUserId: string | null;
	canManage: boolean;
	isAdmin: boolean;
}

export function BuildTeamCard({
	projectId,
	team,
	volunteers,
	teamLeadClerkUserId,
	canManage,
	isAdmin,
}: Props) {
	const [managing, setManaging] = useState(false);
	const empty = team.length === 0;

	return (
		<div className="rounded-card border border-border bg-card p-5">
			<header className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5">
					<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
						Build team
					</p>
					{!empty && (
						<span className="font-mono text-[10px] tabular-nums text-text-muted">
							·  {team.length}
						</span>
					)}
				</div>
				{canManage && (
					<button
						type="button"
						onClick={() => setManaging(true)}
						className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
					>
						<Settings2 className="size-3" aria-hidden />
						Manage
					</button>
				)}
			</header>

			{empty ? (
				<EmptyState canManage={canManage} onManage={() => setManaging(true)} />
			) : (
				<ul className="mt-3 space-y-2">
					{team.map((m) => {
						const isLead = m.clerkUserId === teamLeadClerkUserId;
						return (
							<li
								key={m.id}
								className="flex items-center gap-3 rounded-[6px] border border-border bg-background/40 px-3 py-2"
							>
								<Avatar name={m.userName} size={28} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-text-primary">
										{m.userName}
									</p>
									<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
										{m.role}
									</p>
								</div>
								{isLead && (
									<span
										className="inline-flex items-center rounded-[4px] border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-300"
										title="Team lead"
									>
										Lead
									</span>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{managing && volunteers !== null && (
				<ManageTeamModal
					projectId={projectId}
					team={team}
					volunteers={volunteers}
					teamLeadClerkUserId={teamLeadClerkUserId}
					isAdmin={isAdmin}
					onClose={() => setManaging(false)}
				/>
			)}
		</div>
	);
}

function EmptyState({
	canManage,
	onManage,
}: {
	canManage: boolean;
	onManage: () => void;
}) {
	return (
		<div className="mt-3 flex flex-col items-center gap-2 rounded-[6px] border border-dashed border-border bg-background/40 px-3 py-5 text-center">
			<Users className="size-5 text-text-muted" aria-hidden />
			<p className="text-sm text-text-secondary">No team assembled yet.</p>
			<p className="text-xs text-text-muted leading-relaxed">
				Once the project is picked, the admin assembles a team from the
				volunteers.
			</p>
			{canManage && (
				<button
					type="button"
					onClick={onManage}
					className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:text-accent-hover"
				>
					Browse volunteers
				</button>
			)}
		</div>
	);
}
