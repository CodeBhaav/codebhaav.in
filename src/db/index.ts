import { env } from "@/env";
import { drizzle } from "drizzle-orm/neon-http";
import { waitlist, foundingMember } from "@/db/schema";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    waitlist,
    foundingMember,
  },
});
