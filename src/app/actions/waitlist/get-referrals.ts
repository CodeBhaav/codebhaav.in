"use server";

import prisma from "@/lib/prisma";

export async function getReferralCount(email: string) {
  const user = await prisma.waitlist.findUnique({ where: { email } });
  return user?.referralCount ?? 0;
}
