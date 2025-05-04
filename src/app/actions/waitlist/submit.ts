"use server";

import WaitlistJoinEmail from "@/email/waitlist";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { count, eq, lt, sql } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const existingUser = await db.query.waitlist.findFirst({
    where: (waitlist, { eq }) => eq(waitlist.email, data.email),
  });
  if (existingUser) {
    // Position
    const position = await db
      .select({ count: count() })
      .from(waitlist)
      .where(lt(waitlist.createdAt, existingUser.createdAt))
      .execute()
      .then((result) => result[0]?.count ?? 0);
    return {
      error: "User already exists",
      position: position + 1,
      referralCode: existingUser.referralCode,
    };
  }
  // Create user
  const newUser = await db
    .insert(waitlist)
    .values({
      referralCode,
      updatedAt: new Date(),
      ...data,
    })
    .returning();

  // Handle referral
  if (data.referredBy) {
    await db
      .update(waitlist)
      .set({ referralCount: sql`${waitlist.referralCount} + 1` })
      .where(eq(waitlist.referralCode, data.referredBy))
      .execute();
  }

  // Position
  const position = await db
    .select({ count: count() })
    .from(waitlist)
    .where(lt(waitlist.createdAt, newUser[0].createdAt))
    .execute()
    .then((result) => result[0]?.count ?? 0);
  // Send email
  try {
    const res = await resend.emails.send({
      from: "CodeBhaav <system@codebhaav.in>",
      replyTo: "pranav@codebhaav.in",
      to: [data.email],
      subject: "Welcome to the Waitlist!",
      react: WaitlistJoinEmail({
        name: data.name,
        referralPosition: position + 1,
        referralCode,
      }),
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }

  revalidatePath("/waitlist"); // if needed
  return { position: position + 1, referralCode };
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8);
}
