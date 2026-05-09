import { Providers } from "./Providers";
import { WaitlistPanel } from "../admin/WaitlistPanel";

export default function WaitlistPanelIsland() {
	return (
		<Providers name="WaitlistPanel">
			<WaitlistPanel />
		</Providers>
	);
}
