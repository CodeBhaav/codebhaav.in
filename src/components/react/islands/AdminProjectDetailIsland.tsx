import { Providers } from "./Providers";
import { AdminProjectDetail } from "../admin/AdminProjectDetail";

export default function AdminProjectDetailIsland({ slug }: { slug: string }) {
	return (
		<Providers name="AdminProjectDetail">
			<AdminProjectDetail slug={slug} />
		</Providers>
	);
}
