"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitWaitlist(data: {
  name: string;
  email: string;
  role: string;
  otherRole?: string;
  whatsapp?: string;
  instagram?: string;
  reason: string;
  interests: string[];
  otherInterest?: string;
  referredBy?: string;
}) {
  const referralCode = generateReferralCode();

  // Create user
  const newUser = await prisma.waitlist.create({
    data: {
      ...data,
      referralCode,
    },
  });

  // Handle referral
  if (data.referredBy) {
    await prisma.waitlist.updateMany({
      where: { referralCode: data.referredBy },
      data: { referralCount: { increment: 1 } },
    });
  }

  // Position
  const position = await prisma.waitlist.count({
    where: {
      createdAt: { lt: newUser.createdAt },
    },
  });

  revalidatePath("/waitlist"); // if needed
  return { position: position + 1, referralCode };
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8);
}
