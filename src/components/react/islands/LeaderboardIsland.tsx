import { Providers, ConvexOnlyProviders } from "./Providers";
import { Leaderboard } from "../leaderboard/Leaderboard";
import { UserStatsCard } from "../leaderboard/UserStatsCard";

/** Leaderboard table  no auth needed, Convex only */
export function LeaderboardTableIsland() {
  return (
    <ConvexOnlyProviders name="Leaderboard">
      <Leaderboard />
    </ConvexOnlyProviders>
  );
}

/** User stats  needs Clerk for auth, is the ONLY ClerkProvider on this page */
export function UserStatsIsland() {
  return (
    <Providers name="UserStatsCard">
      <UserStatsCard />
    </Providers>
  );
}
