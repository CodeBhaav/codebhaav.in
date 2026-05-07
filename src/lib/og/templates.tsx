// JSX templates for the OG image. Lives outside src/pages so Astro
// doesn't try to route this file. The endpoint at /api/og.png imports
// the rendered React-element trees and passes them to satori.

const COLORS = {
	bg: "#09090b",
	surface: "#111113",
	border: "#1F1F23",
	textPrimary: "#fafafa",
	textSecondary: "#a1a1aa",
	textMuted: "#71717a",
	accent: "#F59E0B",
	accentDeep: "#D97706",
};

export function ReferralCard({
	firstName,
	avatar,
}: {
	firstName: string;
	avatar: string | null;
}) {
	const initial = firstName.slice(0, 1).toUpperCase();
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: COLORS.bg,
				color: COLORS.textPrimary,
				fontFamily: "Inter",
				position: "relative",
				padding: "60px 80px",
			}}
		>
			{/* warm spotlights */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					background:
						"radial-gradient(ellipse 60% 70% at 18% 20%, rgba(245, 158, 11, 0.18), transparent 65%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					background:
						"radial-gradient(ellipse 50% 50% at 90% 90%, rgba(249, 115, 22, 0.12), transparent 70%)",
				}}
			/>

			{/* inner frame */}
			<div
				style={{
					position: "absolute",
					top: 24,
					left: 24,
					right: 24,
					bottom: 24,
					border: `1px solid ${COLORS.border}`,
					borderRadius: 16,
					display: "flex",
				}}
			/>

			{/* brand */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					zIndex: 10,
				}}
			>
				<div
					style={{
						width: 12,
						height: 12,
						borderRadius: 9999,
						background: COLORS.accent,
						boxShadow: `0 0 24px ${COLORS.accent}`,
					}}
				/>
				<span
					style={{
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: "-0.02em",
						color: COLORS.textPrimary,
					}}
				>
					CodeBhaav
				</span>
			</div>

			{/* main row */}
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 60,
					marginTop: 40,
					zIndex: 10,
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						maxWidth: 720,
					}}
				>
					<span
						style={{
							fontSize: 18,
							color: COLORS.accent,
							letterSpacing: "0.18em",
							textTransform: "uppercase",
							fontWeight: 500,
						}}
					>
						{`Invited by ${firstName}`}
					</span>
					<span
						style={{
							marginTop: 18,
							fontSize: 96,
							lineHeight: 1.02,
							fontWeight: 700,
							letterSpacing: "-0.04em",
							color: COLORS.textPrimary,
						}}
					>
						Join CodeBhaav.
					</span>
					<span
						style={{
							marginTop: 22,
							fontSize: 30,
							lineHeight: 1.35,
							color: COLORS.textSecondary,
							maxWidth: 640,
						}}
					>
						A community for self-taught developers. Code with Bhaav. Build with
						purpose.
					</span>
				</div>

				<div
					style={{
						width: 260,
						height: 260,
						borderRadius: 9999,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background:
							"linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #F97316 100%)",
						padding: 4,
						boxShadow: "0 30px 80px -20px rgba(245, 158, 11, 0.5)",
						flexShrink: 0,
						marginRight: 24,
					}}
				>
					{avatar ? (
						<img
							src={avatar}
							alt=""
							width={252}
							height={252}
							style={{
								width: 252,
								height: 252,
								borderRadius: 9999,
								objectFit: "cover",
							}}
						/>
					) : (
						<div
							style={{
								width: 252,
								height: 252,
								borderRadius: 9999,
								background: COLORS.surface,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 112,
								fontWeight: 700,
								color: COLORS.accent,
								letterSpacing: "-0.04em",
							}}
						>
							{initial}
						</div>
					)}
				</div>
			</div>

			{/* footer */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					zIndex: 10,
					marginTop: 24,
				}}
			>
				<span
					style={{
						fontSize: 16,
						color: COLORS.textMuted,
						letterSpacing: "0.16em",
						textTransform: "uppercase",
					}}
				>
					No fluff · No paid courses · Built in the open
				</span>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "10px 18px",
						borderRadius: 9999,
						border: `1px solid ${COLORS.accentDeep}`,
						background: "rgba(245, 158, 11, 0.08)",
						color: COLORS.accent,
						fontSize: 16,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						fontWeight: 600,
					}}
				>
					Join the waitlist →
				</div>
			</div>
		</div>
	);
}

export interface PageCardProps {
	eyebrow: string;
	title: string;
	titleAccent?: string;
	description: string;
}

export function PageCard({
	eyebrow,
	title,
	titleAccent,
	description,
}: PageCardProps) {
	// Heuristic: shorter titles can be bigger.
	const totalChars = title.length + (titleAccent?.length ?? 0);
	const titleSize = totalChars > 24 ? 88 : totalChars > 16 ? 104 : 112;

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				background: COLORS.bg,
				color: COLORS.textPrimary,
				fontFamily: "Inter",
				position: "relative",
				padding: "60px 80px",
			}}
		>
			{/* warm spotlights */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					background:
						"radial-gradient(ellipse 60% 70% at 30% 20%, rgba(245, 158, 11, 0.18), transparent 65%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					background:
						"radial-gradient(ellipse 50% 50% at 90% 90%, rgba(249, 115, 22, 0.10), transparent 70%)",
				}}
			/>

			{/* inner frame */}
			<div
				style={{
					position: "absolute",
					top: 24,
					left: 24,
					right: 24,
					bottom: 24,
					border: `1px solid ${COLORS.border}`,
					borderRadius: 16,
					display: "flex",
				}}
			/>

			{/* brand */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					zIndex: 10,
				}}
			>
				<div
					style={{
						width: 12,
						height: 12,
						borderRadius: 9999,
						background: COLORS.accent,
						boxShadow: `0 0 24px ${COLORS.accent}`,
					}}
				/>
				<span
					style={{
						fontSize: 24,
						fontWeight: 700,
						letterSpacing: "-0.02em",
					}}
				>
					CodeBhaav
				</span>
			</div>

			{/* main */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					zIndex: 10,
				}}
			>
				<span
					style={{
						fontSize: 20,
						color: COLORS.accent,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						fontWeight: 500,
					}}
				>
					{eyebrow}
				</span>
				<span
					style={{
						marginTop: 20,
						fontSize: titleSize,
						lineHeight: 1,
						fontWeight: 700,
						letterSpacing: "-0.04em",
					}}
				>
					{title}
				</span>
				{titleAccent && (
					<span
						style={{
							fontSize: titleSize,
							lineHeight: 1,
							fontWeight: 700,
							letterSpacing: "-0.04em",
							background:
								"linear-gradient(90deg, #FCD34D, #F59E0B 60%, #F97316)",
							backgroundClip: "text",
							color: "transparent",
						}}
					>
						{titleAccent}
					</span>
				)}
				<span
					style={{
						marginTop: 24,
						fontSize: 28,
						lineHeight: 1.35,
						color: COLORS.textSecondary,
						maxWidth: 880,
					}}
				>
					{description}
				</span>
			</div>

			{/* footer */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					zIndex: 10,
					marginTop: 24,
				}}
			>
				<span
					style={{
						fontSize: 16,
						color: COLORS.textMuted,
						letterSpacing: "0.16em",
						textTransform: "uppercase",
					}}
				>
					No fluff · No paid courses · Built in the open
				</span>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "10px 18px",
						borderRadius: 9999,
						border: `1px solid ${COLORS.accentDeep}`,
						background: "rgba(245, 158, 11, 0.08)",
						color: COLORS.accent,
						fontSize: 16,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						fontWeight: 600,
					}}
				>
					codebhaav.in →
				</div>
			</div>
		</div>
	);
}

// Per-page OG configurations. Keys must match the `?page=` query param.
export const PAGE_OG_CONFIG: Record<string, PageCardProps> = {
	home: {
		eyebrow: "Waitlist Open",
		title: "Code with Bhaav.",
		titleAccent: "Build with purpose.",
		description:
			"A community for self-taught developers, starting in Amravati.",
	},
	mission: {
		eyebrow: "Mission",
		title: "Why we're",
		titleAccent: "building this.",
		description:
			"Building something raw, real, and valuable for self-taught developers.",
	},
	projects: {
		eyebrow: "Projects",
		title: "Build in the open.",
		description:
			"What members are shipping, learning, and breaking together.",
	},
	leaderboard: {
		eyebrow: "Referrals",
		title: "Climb the line",
		titleAccent: "one referral at a time.",
		description:
			"Top referrers get founding-tier access first when the platform opens.",
	},
	contact: {
		eyebrow: "Contact",
		title: "Let's talk.",
		description: "Questions, partnerships, or just want to say hi.",
	},
	"founding-member": {
		eyebrow: "Founding Circle",
		title: "Help shape this.",
		description:
			"A small group of self-taught developers who decide what CodeBhaav becomes.",
	},
	waitlist: {
		eyebrow: "Waitlist",
		title: "Join the line.",
		description:
			"Code with Bhaav. Build with purpose. We open up to founding members first.",
	},
	privacy: {
		eyebrow: "Legal",
		title: "Privacy.",
		description: "How we collect, use, and protect your data.",
	},
	terms: {
		eyebrow: "Legal",
		title: "Terms.",
		description: "The rules of the road for using CodeBhaav.",
	},
};

// Backwards-compat alias for any callers still importing the old name.
export const GenericCard = () => <PageCard {...PAGE_OG_CONFIG.home} />;
