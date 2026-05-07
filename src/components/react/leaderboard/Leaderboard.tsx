import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

export function Leaderboard() {
	const data = useQuery(api.waitlist.getTopReferrers);
	const count = useQuery(api.waitlist.getCount);

	if (data === undefined) {
		return (
			<div className="py-6">
				<div className="h-4 w-48 animate-pulse rounded-[4px] bg-border" />
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="px-6 py-12 text-center text-sm text-text-secondary">
				No referrals yet. Be the first to share your code!
			</div>
		);
	}

	return (
		<div>
			{count !== undefined && (
				<p className="mb-4 font-mono text-xs text-text-muted">
					{count.count.toLocaleString()} total signups
				</p>
			)}
			<div className="overflow-x-auto -mx-2 sm:mx-0">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							<th className="border-b border-border px-2 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted sm:px-0">
								Rank
							</th>
							<th className="border-b border-border px-2 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-text-muted sm:px-0">
								Name
							</th>
							<th className="border-b border-border px-2 py-2 text-right font-mono text-[11px] uppercase tracking-wider text-text-muted sm:px-0">
								Referrals
							</th>
						</tr>
					</thead>
					<tbody>
						{data.map((entry, i) => (
							<tr key={entry.referralCode}>
								<td
									className={cn(
										"w-12 border-b border-border px-2 py-3 font-mono text-sm sm:w-[60px] sm:px-0",
										i === 0 ? "text-accent" : "text-text-secondary",
									)}
								>
									{i + 1}
								</td>
								<td className="max-w-[60vw] truncate border-b border-border px-2 py-3 text-sm text-text-primary sm:max-w-none sm:px-0 sm:text-[15px]">
									{entry.name}
								</td>
								<td className="border-b border-border px-2 py-3 text-right font-mono text-sm text-text-primary sm:px-0">
									{entry.referralCount}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
