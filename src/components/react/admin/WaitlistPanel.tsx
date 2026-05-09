import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { BarList, Card, Title } from "@tremor/react";
import { api } from "../../../../convex/_generated/api";

export function WaitlistPanel() {
	const { user } = useUser();
	const clerkUserId = user?.id;

	const stats = useQuery(
		api.admin.getWaitlistStats,
		clerkUserId ? { clerkUserId } : "skip",
	);
	const list = useQuery(
		api.admin.listWaitlist,
		clerkUserId ? { clerkUserId } : "skip",
	);

	if (!user || !stats || !list) {
		return <LoadingState />;
	}

	return (
		<div>
			<header className="mb-8 flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
						Admin · Alpha
					</p>
					<h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
						Waitlist
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						Pre-launch waitlist signups. This view will be deprecated once the
						platform opens.
					</p>
				</div>
				<a
					href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(list))}`}
					download={`codebhaav-waitlist-${new Date().toISOString().slice(0, 10)}.csv`}
					className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-4 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
				>
					Export CSV
				</a>
			</header>

			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<MetricCard label="Total signups" value={stats.total} />
				<MetricCard label="This week" value={stats.thisWeekCount} />
				<MetricCard label="This month" value={stats.thisMonthCount} />
				<MetricCard
					label="Top referrer"
					value={
						stats.topReferrer
							? `${stats.topReferrer.referralCount}`
							: "—"
					}
					hint={stats.topReferrer?.name ?? "no referrals yet"}
				/>
			</div>

			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card className="bg-surface border-border">
					<Title className="text-text-primary">Interests</Title>
					<p className="mt-1 text-xs text-text-muted">
						How many signups picked each interest tag.
					</p>
					<BarList
						className="mt-5"
						color="amber"
						data={
							stats.byInterest.length > 0
								? stats.byInterest.map((b) => ({
										name: b.name,
										value: b.count,
									}))
								: [{ name: "No data yet", value: 0 }]
						}
					/>
				</Card>

				<Card className="bg-surface border-border">
					<Title className="text-text-primary">Roles</Title>
					<p className="mt-1 text-xs text-text-muted">
						Self-described role at signup.
					</p>
					<BarList
						className="mt-5"
						color="amber"
						data={
							stats.byRole.length > 0
								? stats.byRole.map((b) => ({
										name: b.name,
										value: b.count,
									}))
								: [{ name: "No data yet", value: 0 }]
						}
					/>
				</Card>
			</div>

			<div className="mt-6">
				<Card className="bg-surface border-border">
					<Title className="text-text-primary">Top referrers</Title>
					<p className="mt-1 text-xs text-text-muted">
						By number of successful invites.
					</p>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
									<th className="py-2 pr-4 font-medium">Name</th>
									<th className="py-2 pr-4 font-medium">Code</th>
									<th className="py-2 font-medium text-right">Referrals</th>
								</tr>
							</thead>
							<tbody>
								{stats.topReferrers.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="py-6 text-center text-sm text-text-muted"
										>
											No referrals yet.
										</td>
									</tr>
								) : (
									stats.topReferrers.map((r, i) => (
										<tr
											key={r.referralCode}
											className="border-t border-border text-text-secondary"
										>
											<td className="py-3 pr-4 text-text-primary font-medium">
												<span className="text-text-muted mr-2 font-mono text-xs">
													#{i + 1}
												</span>
												{r.name}
											</td>
											<td className="py-3 pr-4 font-mono text-[12px] text-accent">
												{r.referralCode}
											</td>
											<td className="py-3 text-right font-mono text-[13px] text-text-primary">
												{r.referralCount}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</Card>
			</div>

			<div className="mt-6">
				<Card className="bg-surface border-border">
					<div className="flex items-center justify-between">
						<div>
							<Title className="text-text-primary">All signups</Title>
							<p className="mt-1 text-xs text-text-muted">
								{list.length} {list.length === 1 ? "row" : "rows"} · sorted by most recent
							</p>
						</div>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left font-mono text-[11px] uppercase tracking-wider text-text-muted">
									<th className="py-2 pr-4 font-medium">Name</th>
									<th className="py-2 pr-4 font-medium">Email</th>
									<th className="py-2 pr-4 font-medium">Role</th>
									<th className="py-2 pr-4 font-medium">Interests</th>
									<th className="py-2 pr-4 font-medium">Referrals</th>
									<th className="py-2 pr-4 font-medium">Code</th>
									<th className="py-2 font-medium">Joined</th>
								</tr>
							</thead>
							<tbody>
								{list.length === 0 ? (
									<tr>
										<td
											colSpan={7}
											className="py-6 text-center text-sm text-text-muted"
										>
											No signups yet.
										</td>
									</tr>
								) : (
									list.map((row) => (
										<tr
											key={row.id}
											className="border-t border-border text-text-secondary"
										>
											<td className="py-3 pr-4 text-text-primary font-medium whitespace-nowrap">
												{row.name}
											</td>
											<td className="py-3 pr-4 truncate max-w-[220px]">
												{row.email}
											</td>
											<td className="py-3 pr-4 whitespace-nowrap">
												{row.role}
												{row.otherRole ? ` · ${row.otherRole}` : ""}
											</td>
											<td className="py-3 pr-4 max-w-[200px]">
												<span className="text-xs text-text-muted">
													{row.interests.join(", ")}
												</span>
											</td>
											<td className="py-3 pr-4 font-mono text-[13px] text-text-primary">
												{row.referralCount}
											</td>
											<td className="py-3 pr-4 font-mono text-[12px] text-accent">
												{row.referralCode}
											</td>
											<td className="py-3 font-mono text-[12px] text-text-muted whitespace-nowrap">
												{new Date(row.signedUpAt).toLocaleDateString()}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</Card>
			</div>
		</div>
	);
}

function MetricCard({
	label,
	value,
	hint,
}: {
	label: string;
	value: string | number;
	hint?: string;
}) {
	return (
		<Card className="bg-surface border-border">
			<p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-text-muted">
				{label}
			</p>
			<p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
				{value}
			</p>
			{hint && (
				<p className="mt-1 text-[11px] text-text-muted truncate">{hint}</p>
			)}
		</Card>
	);
}

function toCsv(rows: Array<Record<string, unknown>>): string {
	if (rows.length === 0) return "";
	const headers = ["name", "email", "role", "interests", "referralCount", "referralCode", "signedUpAt"];
	const escape = (v: unknown): string => {
		const s = v == null ? "" : Array.isArray(v) ? v.join("|") : String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const headerRow = headers.join(",");
	const dataRows = rows.map((r) =>
		headers
			.map((h) => {
				if (h === "signedUpAt") {
					return escape(new Date(r.signedUpAt as number).toISOString());
				}
				return escape(r[h]);
			})
			.join(","),
	);
	return [headerRow, ...dataRows].join("\n");
}

function LoadingState() {
	return (
		<div>
			<div className="h-9 w-48 animate-pulse rounded-[4px] bg-surface" />
			<div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
				))}
			</div>
			<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div className="h-72 animate-pulse rounded-card bg-surface" />
				<div className="h-72 animate-pulse rounded-card bg-surface" />
			</div>
		</div>
	);
}
