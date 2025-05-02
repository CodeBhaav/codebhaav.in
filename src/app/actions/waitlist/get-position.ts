"use server";

import prisma from "@/lib/prisma";

export async function getWaitlistPosition(email: string) {
  const user = await prisma.waitlist.findUnique({ where: { email } });
  if (!user) return null;

  const position = await prisma.waitlist.count({
    where: {
      createdAt: { lt: user.createdAt },
    },
  });

  return position + 1;
}
