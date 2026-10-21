-- Audit trail of self-deleted accounts so the Super Admin can see who deleted.
CREATE TABLE IF NOT EXISTS "account_deletions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" NOT NULL,
	"deleted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_deletions_user_id_unique" UNIQUE("user_id")
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account_deletions" ADD CONSTRAINT "account_deletions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_deletions_deleted_idx" ON "account_deletions" USING btree ("deleted_at");
