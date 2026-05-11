import { Providers } from "./Providers";
import { ProjectDetailPanel } from "../projects/ProjectDetailPanel";

export default function ProjectDetailIsland({ slug }: { slug: string }) {
	return (
		<Providers name="ProjectDetail">
			<ProjectDetailPanel slug={slug} />
		</Providers>
	);
}
