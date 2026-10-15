CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('searching', 'assigned', 'arrived', 'shooting', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cancelled_by" AS ENUM('client', 'superadmin');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('due', 'paid');--> statement-breakpoint
CREATE TYPE "public"."payment_via" AS ENUM('app', 'qr');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'paid');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('client', 'creator');--> statement-breakpoint
CREATE TABLE "booking_declines" (
	"booking_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_declines_booking_id_creator_id_pk" PRIMARY KEY("booking_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"client_id" text NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text NOT NULL,
	"client_email" text NOT NULL,
	"creator_id" text,
	"creator_name" text,
	"creator_phone" text,
	"creator_email" text,
	"service_type" "service_type" NOT NULL,
	"service_label" text NOT NULL,
	"duration_id" text NOT NULL,
	"duration_label" text NOT NULL,
	"duration_minutes" integer,
	"occasion" text NOT NULL,
	"shoot_date" date NOT NULL,
	"time_slot" text NOT NULL,
	"address" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"creator_payout" numeric(12, 2) NOT NULL,
	"platform_fee" numeric(12, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'searching' NOT NULL,
	"accepted_at" timestamp with time zone,
	"arrived_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" "cancelled_by",
	"start_otp_code" text,
	"start_otp_attempts" integer DEFAULT 0 NOT NULL,
	"start_otp_issued_at" timestamp with time zone,
	"payment_status" "payment_status",
	"payment_order_id" text,
	"payment_link_id" text,
	"payment_link_url" text,
	"payment_id" text,
	"payment_method" text,
	"payment_via" "payment_via",
	"paid_at" timestamp with time zone,
	"settlement_status" "settlement_status",
	"settlement_eligible_at" timestamp with time zone,
	"payout_id" text,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"services" "service_type"[] NOT NULL,
	"experience_years" integer DEFAULT 1 NOT NULL,
	"gear" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"rating" numeric(2, 1) DEFAULT 5 NOT NULL,
	"upi_id" text DEFAULT '' NOT NULL,
	"terms_version" text DEFAULT '' NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"creator_name" text NOT NULL,
	"creator_phone" text NOT NULL,
	"creator_upi_id" text DEFAULT '' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"booking_count" integer NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"status_reason" text DEFAULT '' NOT NULL,
	"status_changed_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "booking_declines" ADD CONSTRAINT "booking_declines_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_declines" ADD CONSTRAINT "booking_declines_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_feed_idx" ON "bookings" USING btree ("status","service_type","created_at");--> statement-breakpoint
CREATE INDEX "bookings_client_idx" ON "bookings" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_creator_idx" ON "bookings" USING btree ("creator_id","status");--> statement-breakpoint
CREATE INDEX "bookings_payment_idx" ON "bookings" USING btree ("payment_status","settlement_status");--> statement-breakpoint
CREATE INDEX "bookings_order_idx" ON "bookings" USING btree ("payment_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_one_active_job_per_creator" ON "bookings" USING btree ("creator_id") WHERE "bookings"."status" in ('assigned', 'arrived', 'shooting');--> statement-breakpoint
CREATE INDEX "payouts_creator_idx" ON "payouts" USING btree ("creator_id","paid_at");--> statement-breakpoint
CREATE INDEX "payouts_paid_at_idx" ON "payouts" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role","created_at");