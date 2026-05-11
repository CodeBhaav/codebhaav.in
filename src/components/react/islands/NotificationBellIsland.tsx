import { Providers } from "./Providers";
import { NotificationBell } from "../notifications/NotificationBell";

export default function NotificationBellIsland() {
	return (
		<Providers name="NotificationBell">
			<NotificationBell />
		</Providers>
	);
}
