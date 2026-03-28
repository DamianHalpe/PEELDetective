ALTER TABLE "school" ADD COLUMN "leaderboard_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "leaderboard_enabled" boolean DEFAULT true NOT NULL;
