import { env } from "@/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { waitlist, foundingMember } from "@/db/schema";
const sql = neon(env.DATABASE_URL);
export const db = drizzle({
  client: sql,
  schema: {
    waitlist,
    foundingMember,
  },
});
