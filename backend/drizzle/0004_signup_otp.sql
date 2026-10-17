CREATE TABLE IF NOT EXISTS "signup_otps" (
	"email" text PRIMARY KEY NOT NULL,
	"otp_hash" text NOT NULL,
	"payload" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
