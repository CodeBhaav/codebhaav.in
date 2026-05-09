import type { Id } from "../../../../convex/_generated/dataModel";
import { FoundingMemberDetail } from "../admin/FoundingMemberDetail";
import { Providers } from "./Providers";

export default function FoundingMemberDetailIsland({
	applicationId,
}: {
	applicationId: string;
}) {
	return (
		<Providers name="FoundingMemberDetail">
			<FoundingMemberDetail
				applicationId={applicationId as Id<"foundingMember">}
			/>
		</Providers>
	);
}
