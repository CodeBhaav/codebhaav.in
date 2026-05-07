import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const NAV_CTA_CLASS =
  "inline-flex h-9 items-center rounded-button bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover";

export function NavCTA() {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const existing = useQuery(
    api.waitlist.getPosition,
    email ? { email } : "skip",
  );

  if (!isLoaded) return null;

  // Already on waitlist — show Dashboard link
  if (user && existing !== undefined && existing !== null) {
    return (
      <a href="/dashboard" className={NAV_CTA_CLASS}>
        Dashboard
      </a>
    );
  }

  // Not signed in or not on waitlist — show Join Waitlist
  return (
    <a href="/waitlist" className={NAV_CTA_CLASS}>
      Join Waitlist
    </a>
  );
}
