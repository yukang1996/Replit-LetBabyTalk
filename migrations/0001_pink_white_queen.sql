CREATE TABLE "legal_documents" (
	"id" text PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"version" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_legal_documents_type_locale" ON "legal_documents" USING btree ("type","locale");--> statement-breakpoint
CREATE INDEX "idx_legal_documents_active" ON "legal_documents" USING btree ("is_active");