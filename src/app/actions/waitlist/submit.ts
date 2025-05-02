"use server";

import WaitlistJoinEmail from "@/email/waitlist";
import { env } from "@/env";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

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
  const existingUser = await prisma.waitlist.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    // Position
    const position = await prisma.waitlist.count({
      where: {
        createdAt: { lt: existingUser.createdAt },
      },
    });
    return {
      error: "User already exists",
      position: position + 1,
      referralCode: existingUser.referralCode,
    };
  }
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
  // Send email
  const res = await resend.emails.send({
    from: "CodeBhaav <system@codebhaav.in>",
    replyTo: "pranav@codebhaav.in",
    to: [data.email],
    subject: "Welcome to the Waitlist!",
    react: WaitlistJoinEmail({
      name: data.name,
      referralPosition: position + 1,
    }),
  });

  revalidatePath("/waitlist"); // if needed
  return { position: position + 1, referralCode };
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8);
}
