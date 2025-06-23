
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
