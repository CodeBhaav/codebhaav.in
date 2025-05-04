import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { waitlist, foundingMember } from "@/db/schema";
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({
  client: sql,
  schema: {
    waitlist,
    foundingMember,
  },
});
