import { Providers } from "./Providers";
import { IdeaDetailPanel } from "../projects/IdeaDetailPanel";

export default function IdeaDetailIsland({ ideaId }: { ideaId: string }) {
	return (
		<Providers name="IdeaDetail">
			<IdeaDetailPanel ideaId={ideaId} />
		</Providers>
	);
}
