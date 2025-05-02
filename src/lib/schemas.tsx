
import { z } from "zod";

// Define the validation schema
export const foundingMemberSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    github: z.string().optional(),
    linkedin: z.string().optional(),
    portfolio: z.string().optional(),
    skills: z.string().min(1, "Please describe your skills"),
    experience: z.string().min(1, "Please describe your experience"),
    motivation: z.string().min(1, "Please describe your motivation"),
    commitment: z.string().min(1, "Please describe your commitment"),
    ideas: z.string().optional(),
});