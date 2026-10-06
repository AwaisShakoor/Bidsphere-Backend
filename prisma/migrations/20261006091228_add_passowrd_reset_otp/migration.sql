-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password_reset_otp_expires_at" TIMESTAMPTZ,
ADD COLUMN     "password_reset_otp_hash" VARCHAR(255);
