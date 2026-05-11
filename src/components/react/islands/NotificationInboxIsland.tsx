import { Providers } from "./Providers";
import { NotificationInbox } from "../notifications/NotificationInbox";

export default function NotificationInboxIsland() {
	return (
		<Providers name="NotificationInbox">
			<NotificationInbox />
		</Providers>
	);
}
