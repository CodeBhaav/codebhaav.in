import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function Leaderboard() {
	const data = useQuery(api.waitlist.getTopReferrers);
	const count = useQuery(api.waitlist.getCount);

	if (data === undefined) {
		return (
			<div style={{ padding: "24px 0" }}>
				<div
					style={{
						height: "16px",
						width: "200px",
						backgroundColor: "#1F1F23",
						borderRadius: "4px",
						animation: "pulse 2s ease-in-out infinite",
					}}
				/>
				<style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div
				style={{
					padding: "48px 24px",
					textAlign: "center",
					color: "#71717A",
					fontSize: "15px",
				}}
			>
				No referrals yet. Be the first to share your code!
			</div>
		);
	}

	return (
		<div>
			{count !== undefined && (
				<p
					style={{
						fontFamily: "monospace",
						fontSize: "12px",
						color: "#52525B",
						marginBottom: "16px",
					}}
				>
					{count.count.toLocaleString()} total signups
				</p>
			)}
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th
							style={{
								fontFamily: "monospace",
								fontSize: "11px",
								color: "#52525B",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								textAlign: "left",
								padding: "8px 0",
								borderBottom: "1px solid #1F1F23",
							}}
						>
							Rank
						</th>
						<th
							style={{
								fontFamily: "monospace",
								fontSize: "11px",
								color: "#52525B",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								textAlign: "left",
								padding: "8px 0",
								borderBottom: "1px solid #1F1F23",
							}}
						>
							Name
						</th>
						<th
							style={{
								fontFamily: "monospace",
								fontSize: "11px",
								color: "#52525B",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								textAlign: "right",
								padding: "8px 0",
								borderBottom: "1px solid #1F1F23",
							}}
						>
							Referrals
						</th>
					</tr>
				</thead>
				<tbody>
					{data.map((entry, i) => (
						<tr key={entry.referralCode}>
							<td
								style={{
									fontFamily: "monospace",
									fontSize: "14px",
									color: i === 0 ? "#F59E0B" : "#71717A",
									padding: "12px 0",
									borderBottom: "1px solid #1F1F23",
									width: "60px",
								}}
							>
								{i + 1}
							</td>
							<td
								style={{
									fontSize: "15px",
									color: "#FAFAFA",
									padding: "12px 0",
									borderBottom: "1px solid #1F1F23",
								}}
							>
								{entry.name}
							</td>
							<td
								style={{
									fontFamily: "monospace",
									fontSize: "14px",
									color: "#FAFAFA",
									textAlign: "right",
									padding: "12px 0",
									borderBottom: "1px solid #1F1F23",
								}}
							>
								{entry.referralCount}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
