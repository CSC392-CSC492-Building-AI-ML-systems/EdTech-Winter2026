CREATE TABLE "translation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_text" text NOT NULL,
	"translated_text" text,
	"target_language" varchar(16) NOT NULL,
	"model" varchar(64) NOT NULL,
	"token_count" integer,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "translation_logs" ADD CONSTRAINT "translation_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;