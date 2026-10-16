-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verify_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email_verify_otp_expires_at" TIMESTAMPTZ,
ADD COLUMN     "email_verify_otp_hash" VARCHAR(255);
