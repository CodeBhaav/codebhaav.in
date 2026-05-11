import { Providers } from "./Providers";
import { AdminIdeasPanel } from "../admin/AdminIdeasPanel";

export default function AdminIdeasIsland() {
	return (
		<Providers name="AdminIdeas">
			<AdminIdeasPanel />
		</Providers>
	);
}
