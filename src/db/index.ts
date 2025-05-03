import { env } from "@/env";
import { drizzle } from "drizzle-orm/neon-http";
import { waitlist, foundingMember } from "@/db/schema";

export const db = drizzle(env.DATABASE_URL, {
  schema: {
    waitlist,
    foundingMember,
  },
});
