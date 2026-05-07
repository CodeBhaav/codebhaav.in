import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function NavCTA() {
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const existing = useQuery(
    api.waitlist.getPosition,
    email ? { email } : "skip",
  );

  if (!isLoaded) return null;

  // Already on waitlist  show Dashboard link
  if (user && existing !== undefined && existing !== null) {
    return (
      <a
        href="/dashboard"
        style={{
          backgroundColor: "#F59E0B",
          color: "#FFFFFF",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
          transition: "background-color 0.2s ease",
        }}
      >
        Dashboard
      </a>
    );
  }

  // Not signed in or not on waitlist  show Join Waitlist
  return (
    <a
      href="/waitlist"
      style={{
        backgroundColor: "#F59E0B",
        color: "#FFFFFF",
        borderRadius: "6px",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        textDecoration: "none",
        transition: "background-color 0.2s ease",
      }}
    >
      Join Waitlist
    </a>
  );
}
