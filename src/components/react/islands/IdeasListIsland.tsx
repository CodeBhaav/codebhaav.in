import { Providers } from "./Providers";
import { IdeasListPanel } from "../projects/IdeasListPanel";

export default function IdeasListIsland() {
	return (
		<Providers name="IdeasList">
			<IdeasListPanel />
		</Providers>
	);
}
