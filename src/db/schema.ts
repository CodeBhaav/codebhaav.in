import {
  pgTable,
  varchar,
  timestamp,
  integer,
  text,
} from "drizzle-orm/pg-core";
import { cuid2 } from "drizzle-cuid2/postgres";

export const waitlist = pgTable("waitlist", {
  id: cuid2("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  role: varchar("role").notNull(),
  otherRole: varchar("other_role"),
  whatsapp: varchar("whatsapp"),
  instagram: varchar("instagram"),
  reason: text("reason").notNull(),
  interests: text("interests").array().notNull(),
  otherInterest: varchar("other_interest"),
  referralCode: varchar("referral_code").notNull().unique(),
  referredBy: varchar("referred_by"),
  referralCount: integer("referral_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const foundingMember = pgTable("founding_member", {
  id: cuid2("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  github: varchar("github"),
  linkedin: varchar("linkedin"),
  portfolio: varchar("portfolio"),
  skills: text("skills").notNull(),
  experience: text("experience").notNull(),
  motivation: text("motivation").notNull(),
  commitment: text("commitment").notNull(),
  ideas: text("ideas").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
