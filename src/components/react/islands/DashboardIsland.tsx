import { Providers } from "./Providers";
import { Dashboard } from "../dashboard/Dashboard";

export default function DashboardIsland() {
	return (
		<Providers name="Dashboard">
			<Dashboard />
		</Providers>
	);
}
