CREATE TYPE "public"."model_application_status" AS ENUM('new', 'contacted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "model_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"phone_country" varchar(2),
	"whatsapp" varchar(255),
	"instagram" varchar(255),
	"telegram" varchar(255),
	"tiktok" varchar(255),
	"youtube" varchar(255),
	"facebook" varchar(255),
	"email" varchar(255),
	"notes" text,
	"why_choose_us" text,
	"status" "model_application_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
