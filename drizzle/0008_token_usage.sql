ALTER TABLE "submission" ADD COLUMN "tokens_used" integer;--> statement-breakpoint
CREATE TABLE "usage_config" (
	"id" text PRIMARY KEY NOT NULL,
	"daily_cap" integer DEFAULT 100000 NOT NULL,
	"monthly_cap" integer DEFAULT 2000000 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_id" text
);
--> statement-breakpoint
ALTER TABLE "usage_config" ADD CONSTRAINT "usage_config_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
