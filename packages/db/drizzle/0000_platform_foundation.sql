CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE "role" AS ENUM ('user', 'admin');
CREATE TYPE "profile_visibility" AS ENUM ('private', 'friends', 'public');
CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL, "name" text, "email" text UNIQUE, "email_verified" timestamp with time zone, "image" text,
  "role" "role" DEFAULT 'user' NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "accounts" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade, "type" text NOT NULL, "provider" text NOT NULL, "provider_account_id" text NOT NULL,
  "refresh_token" text, "access_token" text, "expires_at" integer, "token_type" text, "scope" text, "id_token" text, "session_state" text,
  PRIMARY KEY ("provider", "provider_account_id")
);
CREATE TABLE "sessions" ("session_token" text PRIMARY KEY NOT NULL, "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade, "expires" timestamp with time zone NOT NULL);
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE TABLE "verification_tokens" ("identifier" text NOT NULL, "token" text NOT NULL, "expires" timestamp with time zone NOT NULL, PRIMARY KEY ("identifier", "token"));
CREATE TABLE "profiles" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade, "handle" text UNIQUE, "display_name" text, "avatar_url" text,
  "timezone" text DEFAULT 'UTC' NOT NULL, "visibility" "profile_visibility" DEFAULT 'private' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "user_id" text REFERENCES "users"("id") ON DELETE set null,
  "action" text NOT NULL, "request_id" text NOT NULL, "ip_hash" text, "metadata" text, "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs" ("user_id", "created_at");