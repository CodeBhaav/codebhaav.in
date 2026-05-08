import {
	Body,
	Container,
	Head,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import * as React from "react";

export const tokens = {
	bg: "#060707",
	panel: "#0a0a0a",
	panelInset: "#111113",
	border: "#1F1F23",
	borderBright: "#2a2a30",
	text: "#fafafa",
	textSecondary: "#a1a1aa",
	textMuted: "#52525b",
	amber: "#f59e0b",
	amberDark: "#b45309",
	amberSoft: "#fde68a",
	amberDarkBg: "#241906",
	amberFg: "#1a1208",
} as const;

export const fonts = {
	sans:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif",
	mono:
		"ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

export const eyebrowStyle: React.CSSProperties = {
	margin: 0,
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 600,
	letterSpacing: "0.18em",
	textTransform: "uppercase",
	lineHeight: 1.4,
};

const PLUS_SIZE = 11;
const PLUS_HALF = (PLUS_SIZE - 1) / 2; // 5

// Plus mark SVG — drawn as two thin strokes the same color as the panel border.
// Same trick as the landing page's CornerPlus: 4 short lines making a "+".
function PlusMark({ style }: { style: React.CSSProperties }) {
	const stroke = tokens.borderBright;
	return (
		<div
			style={{
				position: "absolute",
				width: PLUS_SIZE,
				height: PLUS_SIZE,
				lineHeight: 0,
				fontSize: 0,
				...style,
			}}
		>
			<svg
				width={PLUS_SIZE}
				height={PLUS_SIZE}
				viewBox={`0 0 ${PLUS_SIZE} ${PLUS_SIZE}`}
				xmlns="http://www.w3.org/2000/svg"
				role="presentation"
				aria-hidden="true"
			>
				<line
					x1={0}
					y1={PLUS_HALF}
					x2={PLUS_SIZE}
					y2={PLUS_HALF}
					stroke={stroke}
					strokeWidth={1}
				/>
				<line
					x1={PLUS_HALF}
					y1={0}
					x2={PLUS_HALF}
					y2={PLUS_SIZE}
					stroke={stroke}
					strokeWidth={1}
				/>
			</svg>
		</div>
	);
}

const PAD_X = 16;
const PAD_Y = 32;

interface LayoutProps {
	preview: string;
	children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
	// Plus mark CSS offsets so each SVG's center sits on the panel border line.
	// Math: panel border is at distance PAD_X / PAD_Y from container edge;
	// SVG center is PLUS_HALF + 0.5 from its top-left edge, so offset = PAD - PLUS_HALF.
	const top = PAD_Y - PLUS_HALF;
	const left = PAD_X - PLUS_HALF;
	const right = PAD_X - PLUS_HALF;
	const bottom = PAD_Y - PLUS_HALF;

	return (
		<Html lang="en">
			<Head>
				<meta name="color-scheme" content="dark" />
				<meta name="supported-color-schemes" content="dark" />
				<title>CodeBhaav</title>
			</Head>
			<Preview>{preview}</Preview>
			<Body
				style={{
					margin: 0,
					padding: 0,
					background: tokens.bg,
					color: tokens.text,
					fontFamily: fonts.sans,
					WebkitFontSmoothing: "antialiased",
				}}
			>
				<Container
					style={{
						position: "relative",
						maxWidth: 600,
						width: "100%",
						margin: "0 auto",
						padding: `${PAD_Y}px ${PAD_X}px`,
					}}
				>
					{/* 4 outer-corner plus marks centered on panel-border intersections */}
					<PlusMark style={{ top, left }} />
					<PlusMark style={{ top, right }} />
					<PlusMark style={{ bottom, left }} />
					<PlusMark style={{ bottom, right }} />

					{/* Framed panel — sharp corners */}
					<Section
						style={{
							background: tokens.panel,
							border: `1px solid ${tokens.border}`,
						}}
					>
						<InnerPanel>{children}</InnerPanel>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

function InnerPanel({ children }: { children: React.ReactNode }) {
	return (
		<table
			cellPadding={0}
			cellSpacing={0}
			border={0}
			role="presentation"
			style={{ width: "100%", borderCollapse: "collapse" }}
		>
			<tbody>
				{/* Header band */}
				<tr>
					<td
						style={{
							padding: "16px 28px",
							borderBottom: `1px solid ${tokens.border}`,
						}}
					>
						<Text style={{ ...eyebrowStyle, color: tokens.amber }}>
							CodeBhaav
						</Text>
					</td>
				</tr>
				{/* Body */}
				<tr>
					<td style={{ padding: "32px 28px" }}>{children}</td>
				</tr>
				{/* Footer band */}
				<tr>
					<td
						style={{
							padding: "16px 28px",
							borderTop: `1px solid ${tokens.border}`,
						}}
					>
						<Text
							style={{
								margin: 0,
								fontFamily: fonts.mono,
								fontSize: 11,
								letterSpacing: "0.05em",
								color: tokens.textMuted,
								lineHeight: 1.6,
							}}
						>
							A community for self-taught developers, built in Amravati.
							<br />
							<Link
								href="https://www.codebhaav.in"
								style={{ color: tokens.amber, textDecoration: "none" }}
							>
								codebhaav.in
							</Link>
						</Text>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
