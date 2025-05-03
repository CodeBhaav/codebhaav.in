"use server";

import { db } from "@/db";
import { foundingMember } from "@/db/schema";
import type { z } from "zod";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import FoundingMemberEmail from "@/email/application";
import { env } from "@/env";
import type { foundingMemberSchema } from "@/lib/schemas";

const resend = new Resend(env.RESEND_API_KEY);

export async function submitFoundingMember(
  data: z.infer<typeof foundingMemberSchema>
) {
  try {
    const existingUser = await db.query.foundingMember.findFirst({
      where: (foundingMember, { eq }) => eq(foundingMember.email, data.email),
    });
    if (existingUser) {
      return {
        error: "You are already submitted the application",
        success: false,
      };
    }
    // Create user
    await db
      .insert(foundingMember)
      .values({
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        ideas: data.ideas ?? "", // Provide a default value if undefined
        ...data,
      })
      .returning();
    // Send email using your email service
    await resend.emails.send({
      from: "CodeBhaav <system@codebhaav.in>",
      replyTo: "pranav@codebhaav.in",
      to: [data.email],
      subject: "Welcome to the Waitlist!",
      react: FoundingMemberEmail({
        name: data.name,
      }),
    });
    revalidatePath("/thanks"); // adjust as needed
    return { success: true };
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
