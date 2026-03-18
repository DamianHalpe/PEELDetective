CREATE TABLE "badge" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_name" text NOT NULL,
	"trigger_condition" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"crime_description" text NOT NULL,
	"suspects" jsonb NOT NULL,
	"clues" jsonb NOT NULL,
	"correct_culprit" text NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_badge" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"scenario_id" text NOT NULL,
	"response_text" text NOT NULL,
	"score_point" integer,
	"score_evidence" integer,
	"score_explain" integer,
	"score_link" integer,
	"total_score" integer,
	"feedback_json" jsonb,
	"grammar_flags_json" jsonb,
	"model_answer" text,
	"teacher_override_score" integer,
	"teacher_override_note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"ai_evaluated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "school_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scenario" ADD CONSTRAINT "scenario_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badge" ADD CONSTRAINT "student_badge_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badge" ADD CONSTRAINT "student_badge_badge_id_badge_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_scenario_id_scenario_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;