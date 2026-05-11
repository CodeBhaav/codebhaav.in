import { Providers } from "./Providers";
import { ProfilePanel } from "../profile/ProfilePanel";

export default function ProfileIsland({ username }: { username: string }) {
	return (
		<Providers name="Profile">
			<ProfilePanel username={username} />
		</Providers>
	);
}
