import { FlickeringGrid } from "@/components/react/ui/flickering-grid";

export function HeroBackdrop() {
	return (
		<div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
			{/* flickering grid, masked to fade at edges */}
			<div
				className="absolute inset-0"
				style={{
					maskImage:
						"radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 75%)",
					WebkitMaskImage:
						"radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 75%)",
				}}
			>
				<FlickeringGrid
					squareSize={3}
					gridGap={6}
					color="rgb(245, 158, 11)"
					maxOpacity={0.18}
					flickerChance={0.12}
				/>
			</div>
		</div>
	);
}
