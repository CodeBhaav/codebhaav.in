"use server";

import prisma from "@/lib/prisma"; // update the import path as needed
import type { z } from "zod";
import { revalidatePath } from "next/cache";
import type { foundingMemberSchema } from "@/app/founding-member/page";
import { Resend } from "resend";
import FoundingMemberEmail from "@/email/application";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function submitFoundingMember(
  data: z.infer<typeof foundingMemberSchema>
) {
  try {
    await prisma.foundingMember.create({
      data: {
        ...data, // spread operator to include all fields
        ideas: data.ideas || "",
      },
    });
    // Send email using your email service
    await resend.emails.send({
      from: "system@codebhaav.in",
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
