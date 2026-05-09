import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
	LegendRow,
	MetricCard,
	Panel,
	PanelHeader,
	StatusPill,
} from "./AdminOverview";

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
	submitted: "Submitted",
	in_review: "In review",
	accepted: "Accepted",
	rejected: "Rejected",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
	submitted: "#52525b",
	in_review: "#f59e0b",
	accepted: "#10b981",
	rejected: "#f43f5e",
};

export function FoundingMembersPanel() {
	const { user } = useUser();

	const stats = useQuery(api.admin.getFoundingStats, user ? {} : "skip");
	const list = useQuery(api.admin.listFoundingMembers, user ? {} : "skip");
	const flipStatus = useMutation(api.admin.flipFoundingStatus);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [pendingFlip, setPendingFlip] = useState<string | null>(null);
	const [flipError, setFlipError] = useState<string | null>(null);

	if (!user || !stats || !list) {
		return <LoadingState />;
	}

	const handleFlip = async (
		id: Id<"foundingMember">,
		newStatus: ApplicationStatus,
	) => {
		setFlipError(null);
		setPendingFlip(id);
		try {
			await flipStatus({ applicationId: id, status: newStatus });
		} catch (err) {
			setFlipError(
				err instanceof Error ? err.message : "Failed to update status",
			);
		} finally {
			setPendingFlip(null);
		}
	};

	const statusData = stats.byStatus
		.filter((s) => s.count > 0)
		.map((s) => ({
			name: STATUS_LABELS[s.name as ApplicationStatus] ?? s.name,
			value: s.count,
			fill: STATUS_COLORS[s.name as ApplicationStatus] ?? "#52525b",
		}));

	return (
		<div className="space-y-6">
			<header>
				<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
					Admin
				</p>
				<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
					Founding Members
				</h1>
				<p className="mt-1.5 text-sm text-text-secondary">
					Review applications and flip status inline. Status changes fire the
					corresponding email automatically.
				</p>
			</header>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<MetricCard label="Total" value={stats.total} />
				<MetricCard
					label="Pending review"
					value={stats.submittedCount}
					tone={stats.submittedCount > 0 ? "amber" : "neutral"}
				/>
				<MetricCard label="Accepted" value={stats.acceptedCount} />
				<MetricCard label="Rejected" value={stats.rejectedCount} />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Panel className="lg:col-span-1">
					<PanelHeader title="Status breakdown" hint="All-time" />
					{statusData.length === 0 ? (
						<p className="mt-8 py-12 text-center text-sm text-text-muted">
							No applications yet.
						</p>
					) : (
						<>
							<div className="mt-4 h-44">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={statusData}
											dataKey="value"
											nameKey="name"
											innerRadius={45}
											outerRadius={75}
											paddingAngle={2}
											strokeWidth={0}
										>
											{statusData.map((entry) => (
												<Cell key={entry.name} fill={entry.fill} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "#0a0a0a",
												border: "1px solid #1F1F23",
												borderRadius: 6,
												fontSize: 12,
											}}
											labelStyle={{ color: "#a1a1aa" }}
											itemStyle={{ color: "#fafafa" }}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<LegendRow
								items={statusData.map((s) => ({
									label: `${s.name} (${s.value})`,
									color: s.fill,
								}))}
							/>
						</>
					)}
				</Panel>

				<Panel className="lg:col-span-2">
					<PanelHeader title="How it works" />
					<div className="mt-4 space-y-3 text-sm text-text-secondary">
						<p>
							Click a row below to expand the full submission. Use the status
							buttons in the expanded panel to move an application through the
							pipeline:
						</p>
						<ul className="space-y-2 text-xs text-text-muted">
							<li className="flex items-start gap-3">
								<span className="shrink-0">
									<StatusPill status="submitted" />
								</span>
								<span>
									Initial state. Applicant can still edit until you flip
									this.
								</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="shrink-0">
									<StatusPill status="in_review" />
								</span>
								<span>
									You're actively reviewing. No email sent. Edits locked
									for the applicant.
								</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="shrink-0">
									<StatusPill status="accepted" />
								</span>
								<span>Sends the accepted email with dashboard CTA.</span>
							</li>
							<li className="flex items-start gap-3">
								<span className="shrink-0">
									<StatusPill status="rejected" />
								</span>
								<span>
									Sends the rejection email reaffirming waitlist place.
								</span>
							</li>
						</ul>
					</div>
				</Panel>
			</div>

			{flipError && (
				<div className="rounded-[6px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
					{flipError}
				</div>
			)}

			<Panel>
				<PanelHeader
					title={`All applications (${list.length})`}
					hint="Click a row to view the full submission."
				/>
				<div className="mt-4 space-y-2">
					{list.length === 0 ? (
						<p className="py-8 text-center text-sm text-text-muted">
							No applications yet.
						</p>
					) : (
						list.map((app) => {
							const isExpanded = expandedId === app.id;
							const isPending = pendingFlip === app.id;
							return (
								<div
									key={app.id}
									className="rounded-[6px] border border-border bg-background overflow-hidden"
								>
									<button
										type="button"
										onClick={() =>
											setExpandedId(isExpanded ? null : app.id)
										}
										className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-text-primary truncate">
												{app.name}
											</p>
											<p className="text-xs text-text-muted truncate">
												{app.email}
											</p>
										</div>
										<p className="font-mono text-[11px] text-text-muted whitespace-nowrap">
											{new Date(app.submittedAt).toLocaleDateString()}
										</p>
										<StatusPill status={app.status} />
										<span className="font-mono text-xs text-text-muted">
											{isExpanded ? "−" : "+"}
										</span>
									</button>
									{isExpanded && (
										<div className="border-t border-border px-4 py-4">
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<div>
													<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
														Contact
													</p>
													<dl className="mt-2 space-y-1 text-xs text-text-secondary">
														<DLRow
															label="WhatsApp"
															value={app.profile.whatsapp}
														/>
														<DLRow
															label="GitHub"
															value={app.profile.github}
														/>
														<DLRow
															label="LinkedIn"
															value={app.profile.linkedin}
														/>
														<DLRow
															label="Portfolio"
															value={app.profile.portfolio}
														/>
													</dl>
												</div>
												<div>
													<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
														Skills & Experience
													</p>
													<p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">
														{app.profile.skills || "—"}
													</p>
													<p className="mt-3 whitespace-pre-wrap text-xs text-text-secondary">
														{app.profile.experience || "—"}
													</p>
												</div>
												<div className="md:col-span-2">
													<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
														Motivation
													</p>
													<p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">
														{app.motivation}
													</p>
												</div>
												<div>
													<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
														Commitment
													</p>
													<p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">
														{app.commitment}
													</p>
												</div>
												<div>
													<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
														Ideas
													</p>
													<p className="mt-2 whitespace-pre-wrap text-xs text-text-secondary">
														{app.ideas || "—"}
													</p>
												</div>
											</div>
											<div className="mt-6 flex flex-wrap items-center gap-3">
												<p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
													Set status
												</p>
												{(
													[
														"submitted",
														"in_review",
														"accepted",
														"rejected",
													] as const
												).map((s) => (
													<button
														key={s}
														type="button"
														disabled={isPending || app.status === s}
														onClick={() => handleFlip(app.id, s)}
														className="inline-flex items-center rounded-[4px] border border-border bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
													>
														{STATUS_LABELS[s]}
													</button>
												))}
												{isPending && (
													<span className="text-xs text-text-muted">
														saving…
													</span>
												)}
											</div>
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</Panel>
		</div>
	);
}

function DLRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-wrap gap-2">
			<dt className="text-text-muted">{label}</dt>
			<dd className="text-text-secondary truncate">{value ? value : "—"}</dd>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="h-9 w-56 animate-pulse rounded-[4px] bg-surface" />
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
				))}
			</div>
			<div className="h-64 animate-pulse rounded-card bg-surface" />
		</div>
	);
}
