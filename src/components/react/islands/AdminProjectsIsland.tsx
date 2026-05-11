import { Providers } from "./Providers";
import { AdminProjectsPanel } from "../admin/AdminProjectsPanel";

export default function AdminProjectsIsland() {
	return (
		<Providers name="AdminProjects">
			<AdminProjectsPanel />
		</Providers>
	);
}
