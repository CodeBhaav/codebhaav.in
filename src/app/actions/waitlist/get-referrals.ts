"use server";

import { db } from "@/db";
import { waitlist } from "@/db/schema";

export async function getReferralCount(email: string) {
  const user = await db.query.waitlist.findFirst({
    where: (waitlist, { eq }) => eq(waitlist.email, email),
    columns: { referralCount: true },
  });
  if (!user) {
    return 0;
  }
  return user?.referralCount ?? 0;
}
