ALTER TABLE "scenario" ADD COLUMN "free_to_view" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "submission_student_id_idx" ON "submission" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "submission_scenario_id_idx" ON "submission" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_student_scenario_idx" ON "submission" USING btree ("student_id","scenario_id");