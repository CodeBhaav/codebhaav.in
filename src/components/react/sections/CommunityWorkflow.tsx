import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";

type WorkStep = {
	id: string;
	handle: string;
	scope: string;
	status: string;
	step: string;
};

const steps: WorkStep[] = [
	{
		id: "1",
		handle: "frontend.pair",
		scope: "track 1",
		status: "Polishing the landing animations…",
		step: "Sprint 1 of 3",
	},
	{
		id: "2",
		handle: "backend.pair",
		scope: "track 2",
		status: "Wiring the referral leaderboard API…",
		step: "Sprint 2 of 3",
	},
	{
		id: "3",
		handle: "design.pair",
		scope: "track 3",
		status: "Reviewing typography & spacing…",
		step: "Sprint 3 of 3",
	},
];

const STEP_DELAYS = [200, 1100, 2000];

function CodeIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-accent shrink-0"
		>
			<polyline points="16 18 22 12 16 6" />
			<polyline points="8 6 2 12 8 18" />
		</svg>
	);
}

function WorkflowCard({ step }: { step: WorkStep }) {
	return (
		<div className="bg-card border border-border rounded-card overflow-hidden shadow-2xl min-w-[200px] sm:min-w-[280px]">
			<div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
				<CodeIcon />
				<span className="text-sm font-medium text-text-primary truncate">
					{step.handle}
				</span>
				<span className="ml-auto font-mono text-[10px] text-text-muted">
					{step.scope}
				</span>
			</div>
			<div className="px-3 py-2.5 flex items-center justify-between gap-2">
				<p className="text-sm text-text-secondary truncate">{step.status}</p>
				<span className="hidden sm:inline-block font-mono text-[10px] text-text-muted whitespace-nowrap">
					{step.step}
				</span>
			</div>
		</div>
	);
}

function ConnectorSVG({
	className,
	flip = false,
}: {
	className?: string;
	flip?: boolean;
}) {
	return (
		<motion.svg
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4 }}
			className={`pointer-events-none w-16 sm:w-24 h-fit ${className ?? ""}`}
			viewBox="0 0 96 101"
			fill="none"
			style={flip ? { transform: "scaleX(-1)" } : undefined}
		>
			<motion.path
				initial={{ pathLength: 0 }}
				animate={{ pathLength: 1 }}
				transition={{ duration: 0.7, ease: "easeInOut" }}
				d="M16 7.99999L64 8C72.8366 8 80 15.1634 80 24L80 82"
				stroke="#F59E0B"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
			/>
			<motion.path
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.7 }}
				d="M88.7046 80.293C89.0951 80.6835 89.0951 81.3165 88.7046 81.707L81.4116 89C80.6306 89.7808 79.3645 89.7809 78.5835 89L71.2905 81.707C70.9001 81.3166 70.9002 80.6835 71.2905 80.293C71.681 79.9025 72.3141 79.9025 72.7046 80.293L78.9741 86.5625L78.9741 81.9609C78.9741 81.4087 79.4218 80.9609 79.9741 80.9609C80.5264 80.9609 80.9741 81.4087 80.9741 81.9609L80.9741 86.6094L87.2905 80.293C87.681 79.9025 88.3141 79.9025 88.7046 80.293Z"
				fill="#F59E0B"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
			<motion.path
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.3, duration: 0.3 }}
				d="M16 2C12.6863 2 10 4.68629 10 8C10 11.3137 12.6863 14 16 14C19.3137 14 22 11.3137 22 8C22 4.68629 19.3137 2 16 2Z"
				fill="#0a0a0b"
				stroke="#F59E0B"
				strokeWidth="2"
				fillRule="evenodd"
				clipRule="evenodd"
				style={{ transformOrigin: "16px 8px" }}
			/>
		</motion.svg>
	);
}

function StepCard({
	step,
	className,
	showConnector = false,
	connectorClassName = "absolute -right-20 top-8",
	flip = false,
}: {
	step: WorkStep;
	className?: string;
	showConnector?: boolean;
	connectorClassName?: string;
	flip?: boolean;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -16 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -16 }}
			transition={{ duration: 0.45, delay: 0.2 }}
			className={className}
		>
			{showConnector && (
				<ConnectorSVG className={connectorClassName} flip={flip} />
			)}
			<WorkflowCard step={step} />
		</motion.div>
	);
}

export function CommunityWorkflow() {
	const blockRef = useRef<HTMLDivElement>(null);
	const inView = useInView(blockRef, {
		amount: 0.5,
		margin: "0px 0px -10% 0px",
	});
	const [visibleSteps, setVisibleSteps] = useState(0);

	useEffect(() => {
		if (!inView) {
			const t = setTimeout(() => setVisibleSteps(0), 0);
			return () => clearTimeout(t);
		}
		const timers = STEP_DELAYS.map((delay, i) =>
			setTimeout(() => setVisibleSteps(i + 1), delay),
		);
		return () => timers.forEach(clearTimeout);
	}, [inView]);

	return (
		<div
			ref={blockRef}
			className="relative min-h-[460px] md:min-h-[520px] flex p-4 sm:p-6 md:p-12 overflow-visible"
		>
			<div className="w-full max-w-lg mx-auto relative">
				<AnimatePresence>
					{visibleSteps >= 1 && (
						<StepCard
							step={steps[0]}
							className="relative z-10 w-fit -ml-2"
							showConnector={visibleSteps >= 2}
							connectorClassName="absolute -right-12 top-8 sm:-right-20"
						/>
					)}
				</AnimatePresence>
				<AnimatePresence>
					{visibleSteps >= 2 && (
						<StepCard
							step={steps[1]}
							className="relative z-10 mt-8 sm:mt-12 ml-auto w-fit -mr-4"
							showConnector={visibleSteps >= 3}
							connectorClassName="absolute -left-12 top-8 sm:-left-20"
							flip
						/>
					)}
				</AnimatePresence>
				<AnimatePresence>
					{visibleSteps >= 3 && (
						<StepCard
							step={steps[2]}
							className="relative z-10 mt-8 sm:mt-12 max-w-xl -ml-4"
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
