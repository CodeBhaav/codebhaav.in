import { AdminMobileNav, AdminSidebar } from "../admin/AdminSidebar";

type NavKey = "overview" | "waitlist" | "founding-members";

export default function AdminSidebarIsland({
	active,
	variant = "desktop",
}: {
	active: NavKey;
	variant?: "desktop" | "mobile";
}) {
	if (variant === "mobile") {
		return <AdminMobileNav active={active} />;
	}
	return <AdminSidebar active={active} />;
}
