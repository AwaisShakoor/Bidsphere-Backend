import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendOtpEmail(to: string, subject: string, text: string) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
  });
}

export async function sendEmailVerificationOtp(to: string, otp: string) {
  await sendOtpEmail(
    to,
    "BidSphere email verification OTP",
    `Your email verification OTP is ${otp}. Use this code to activate your account. This OTP will expire in 10 minutes.`,
  );
}

export async function sendPasswordResetOtp(to: string, otp: string) {
  await sendOtpEmail(
    to,
    "BidSphere password reset OTP",
    `Your password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
  );
}
