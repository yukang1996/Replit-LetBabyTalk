-- Create sessions table (required for auth)
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"phone" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"user_role" varchar DEFAULT 'parent',
	"profile_image_url" varchar,
	"is_guest" boolean DEFAULT false,
	"language" varchar DEFAULT 'en',
	"has_completed_onboarding" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);

-- Create baby_profiles table
CREATE TABLE IF NOT EXISTS "baby_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"gender" varchar NOT NULL,
	"photo_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS "recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"baby_profile_id" integer,
	"filename" varchar NOT NULL,
	"duration" integer,
	"analysis_result" jsonb,
	"vote" varchar,
	"recorded_at" timestamp DEFAULT now()
);

-- Create cry_reason_descriptions table
CREATE TABLE IF NOT EXISTS "cry_reason_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_name" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cry_reason_descriptions_class_name_unique" UNIQUE("class_name")
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "baby_profiles" ADD CONSTRAINT "baby_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recordings" ADD CONSTRAINT "recordings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recordings" ADD CONSTRAINT "recordings_baby_profile_id_baby_profiles_id_fk" FOREIGN KEY ("baby_profile_id") REFERENCES "baby_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;