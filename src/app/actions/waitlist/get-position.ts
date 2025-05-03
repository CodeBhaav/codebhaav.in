"use server";

import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { count, lt } from "drizzle-orm";

export async function getWaitlistPosition(email: string) {
  const user = await db.query.waitlist.findFirst({
    where: (waitlist, { eq }) => eq(waitlist.email, email),
    columns: { createdAt: true },
  });
  if (!user) return null;

  const position = await db
    .select({ count: count() })
    .from(waitlist)
    .where(lt(waitlist.createdAt, user.createdAt))
    .execute()
    .then((result) => result[0]?.count ?? 0);

  return position + 1;
}
