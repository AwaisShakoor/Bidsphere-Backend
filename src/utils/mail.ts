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

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "BidSphere password reset OTP",
    text: `Your password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
  });
}
