CREATE TABLE "founding_member" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"github" varchar,
	"linkedin" varchar,
	"portfolio" varchar,
	"skills" text NOT NULL,
	"experience" text NOT NULL,
	"motivation" text NOT NULL,
	"commitment" text NOT NULL,
	"ideas" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "founding_member_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"other_role" varchar,
	"whatsapp" varchar,
	"instagram" varchar,
	"reason" text NOT NULL,
	"interests" text[] NOT NULL,
	"other_interest" varchar,
	"referral_code" varchar NOT NULL,
	"referred_by" varchar,
	"referral_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_referral_code_unique" UNIQUE("referral_code")
);
