import { Providers } from "./Providers";
import { ProjectsListPanel } from "../projects/ProjectsListPanel";

export default function ProjectsListIsland() {
	return (
		<Providers name="ProjectsList">
			<ProjectsListPanel />
		</Providers>
	);
}
