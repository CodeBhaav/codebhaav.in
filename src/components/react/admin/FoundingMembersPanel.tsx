import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { Card, DonutChart, Legend, Title } from "@tremor/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { StatusPill } from "./AdminOverview";

type ApplicationStatus = "submitted" | "in_review" | "accepted" | "rejected";

export function FoundingMembersPanel() {
	const { user } = useUser();

	const stats = useQuery(
		api.admin.getFoundingStats,
		user ? {} : "skip",
	);
	const list = useQuery(
		api.admin.listFoundingMembers,
		user ? {} : "skip",
	);
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
			await flipStatus({
				applicationId: id,
				status: newStatus,
			});
		} catch (err) {
			setFlipError(
				err instanceof Error ? err.message : "Failed to update status",
			);
		} finally {
			setPendingFlip(null);
		}
	};

	const statusColors: Record<string, string> = {
		Submitted: "slate",
		"In review": "amber",
		Accepted: "emerald",
		Rejected: "rose",
	};

	const statusData = stats.byStatus.map((s) => ({
		name: STATUS_LABELS[s.name],
		count: s.count,
	}));

	return (
		<div>
			<header className="mb-8">
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

			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-1 bg-surface border-border">
					<Title className="text-text-primary">Status breakdown</Title>
					<DonutChart
						className="mt-6 h-44"
						data={statusData}
						category="count"
						index="name"
						colors={["slate", "amber", "emerald", "rose"]}
						showAnimation
						valueFormatter={(v) => v.toString()}
					/>
					<Legend
						className="mt-4"
						categories={statusData.map((d) => d.name)}
						colors={statusData.map(
							(d) => statusColors[d.name] ?? "slate",
						)}
					/>
				</Card>

				<Card className="lg:col-span-2 bg-surface border-border">
					<Title className="text-text-primary">How it works</Title>
					<div className="mt-4 space-y-3 text-sm text-text-secondary">
						<p>
							Click a row to expand the full submission. Use the status
							dropdown on the right to move an application through the
							pipeline:
						</p>
						<ul className="space-y-2 text-xs text-text-muted">
							<li className="flex items-start gap-3">
								<StatusPill status="submitted" />
								<span>
									Initial state. Applicant can still edit until you flip
									this.
								</span>
							</li>
							<li className="flex items-start gap-3">
								<StatusPill status="in_review" />
								<span>
									You're actively reviewing. No email sent. Edits locked
									for the applicant.
								</span>
							</li>
							<li className="flex items-start gap-3">
								<StatusPill status="accepted" />
								<span>
									Sends the accepted email with dashboard CTA.
								</span>
							</li>
							<li className="flex items-start gap-3">
								<StatusPill status="rejected" />
								<span>
									Sends the rejection email reaffirming waitlist place.
								</span>
							</li>
						</ul>
					</div>
				</Card>
			</div>

			{flipError && (
				<div className="mt-4 rounded-[6px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
					{flipError}
				</div>
			)}

			<div className="mt-6">
				<Card className="bg-surface border-border">
					<Title className="text-text-primary">
						All applications ({list.length})
					</Title>
					<p className="mt-1 text-xs text-text-muted">
						Click a row to view the full submission.
					</p>
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
										className="rounded-[6px] border border-border bg-card overflow-hidden"
									>
										<button
											type="button"
											onClick={() =>
												setExpandedId(isExpanded ? null : app.id)
											}
											className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
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
				</Card>
			</div>
		</div>
	);
}

const STATUS_LABELS: Record<string, string> = {
	submitted: "Submitted",
	in_review: "In review",
	accepted: "Accepted",
	rejected: "Rejected",
};

function DLRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-wrap gap-2">
			<dt className="text-text-muted">{label}</dt>
			<dd className="text-text-secondary truncate">
				{value ? value : "—"}
			</dd>
		</div>
	);
}

function MetricCard({
	label,
	value,
	tone = "neutral",
}: {
	label: string;
	value: string | number;
	tone?: "neutral" | "amber";
}) {
	const valueClass =
		tone === "amber" ? "text-accent" : "text-text-primary";
	return (
		<Card className="bg-surface border-border">
			<p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-text-muted">
				{label}
			</p>
			<p
				className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${valueClass}`}
			>
				{value}
			</p>
		</Card>
	);
}

function LoadingState() {
	return (
		<div>
			<div className="h-9 w-56 animate-pulse rounded-[4px] bg-surface" />
			<div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
				))}
			</div>
			<div className="mt-6 h-64 animate-pulse rounded-card bg-surface" />
		</div>
	);
}
