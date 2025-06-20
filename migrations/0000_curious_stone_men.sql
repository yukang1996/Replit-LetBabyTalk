CREATE TABLE "baby_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"gender" varchar NOT NULL,
	"photo_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cry_reason_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cry_reason_descriptions_class_name_unique" UNIQUE("class_name")
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"baby_profile_id" integer,
	"filename" varchar NOT NULL,
	"duration" integer,
	"analysis_result" jsonb,
	"vote" varchar,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"password" text,
	"first_name" text,
	"last_name" text,
	"user_role" text,
	"profile_image_url" text,
	"is_guest" boolean DEFAULT false,
	"language" text DEFAULT 'en',
	"has_completed_onboarding" boolean DEFAULT false,
	"deactivated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "baby_profiles" ADD CONSTRAINT "baby_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_baby_profile_id_baby_profiles_id_fk" FOREIGN KEY ("baby_profile_id") REFERENCES "public"."baby_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");