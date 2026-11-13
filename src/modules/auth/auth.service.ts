import { prisma } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import bcrypt from "bcrypt";
import { loginDto } from "./dto/login.dto";
import jwt from "jsonwebtoken";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import {
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
} from "../../utils/mail";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { VerifyResetOtpDto } from "./dto/verify-reset-otp.dto";
import { randomBytes } from "crypto";
import { redis } from "../../config/redis";

const PASSWORD_RESET_TOKEN_TTL_SECONDS = 10 * 60;

async function issueEmailVerificationOtp(userId: string, email: string) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpHash = await bcrypt.hash(otp.toString(), 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyOtpHash: otpHash,
      emailVerifyOtpExpiresAt: expiresAt,
      emailVerifyOtpAttempts: 0,
    },
  });

  await sendEmailVerificationOtp(email, otp.toString());
}

export async function registerUser(registerDto: RegisterDto) {
  const email = registerDto.email.toLowerCase();

  const role = registerDto.role ?? "BUYER";
  if (role !== "BUYER" && role !== "SELLER") {
    throw new Error("Invalid role");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser?.isActive) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(registerDto.password, 10);

  // Inactive account: update details and send a fresh OTP instead of blocking.
  if (existingUser && !existingUser.isActive) {
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await issueEmailVerificationOtp(user.id, email);

    return {
      message: "OTP sent successfully.",
      user,
      code: "EMAIL_NOT_VERIFIED" as const,
    };
  }

  const user = await prisma.user.create({
    data: {
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email,
      role,
      passwordHash: hashedPassword,
      isActive: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  await issueEmailVerificationOtp(user.id, email);

  return {
    message: "OTP sent successfully.",
    user,
  };
}

export async function resendVerificationOtp(emailRaw: string) {
  const email = emailRaw.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false as const, message: "User not found" };
  }

  if (user.isActive) {
    return { success: false as const, message: "Email already verified" };
  }

  await issueEmailVerificationOtp(user.id, email);

  return {
    success: true as const,
    message: "OTP sent successfully.",
    code: "EMAIL_NOT_VERIFIED" as const,
  };
}

export async function createAuthSession(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: Date;
}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    secret,
    { expiresIn: "15m" },
  );

  const refreshToken = randomBytes(32).toString("hex");
  const weekInSeconds = 60 * 60 * 24 * 7;

  await redis.set(`refreshToken:${refreshToken}`, user.id, {
    EX: weekInSeconds,
  });
  await redis.sAdd(`user-refresh:${user.id}`, refreshToken);
  await redis.expire(`user-refresh:${user.id}`, weekInSeconds);

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

export async function refreshToken(refreshToken: string) {
  const userId = await redis.getDel(`refreshToken:${refreshToken}`);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || !user.isActive) {
    throw new Error("Unauthorized");
  }
  return await createAuthSession(user);
}

export async function logoutUser(refreshTokenCookie?: string) {
  if (!refreshTokenCookie) {
    return;
  }

  const userId = await redis.getDel(`refreshToken:${refreshTokenCookie}`);
  if (userId) {
    await redis.sRem(`user-refresh:${userId}`, refreshTokenCookie);
  }
}

export async function verifyEmail(verifyEmailDto: VerifyEmailDto) {
  const email = verifyEmailDto.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.emailVerifyOtpHash || !user.emailVerifyOtpExpiresAt) {
    return { success: false as const, message: "Invalid or expired OTP" };
  }

  if (user.isActive) {
    return { success: false as const, message: "Email already verified" };
  }

  if (user.emailVerifyOtpExpiresAt < new Date()) {
    return { success: false as const, message: "OTP expired" };
  }

  if (user.emailVerifyOtpAttempts >= 5) {
    return { success: false as const, message: "Too many attempts" };
  }

  const isOtpValid = await bcrypt.compare(
    verifyEmailDto.otp,
    user.emailVerifyOtpHash,
  );

  if (!isOtpValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyOtpAttempts: { increment: 1 },
      },
    });
    return { success: false as const, message: "Invalid OTP" };
  }

  const activatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive: true,
      emailVerifyOtpHash: null,
      emailVerifyOtpExpiresAt: null,
      emailVerifyOtpAttempts: 0,
    },
  });

  const session = await createAuthSession(activatedUser);

  return {
    success: true as const,
    message: "Email verified successfully",
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
  };
}

export async function loginUser(loginDto: loginDto) {
  const email = loginDto.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    loginDto.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return await createAuthSession(user);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

export async function forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  // Make email consistant
  const email = forgotPasswordDto.email.toLowerCase();

  //find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  //check if user exists
  if (!user || !user.isActive) {
    return { success: false, message: "User not found" };
  }

  //create 6 digit otp
  const otp = Math.floor(100000 + Math.random() * 900000);

  //hash otp
  const otpHash = await bcrypt.hash(otp.toString(), 10);

  //Expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  //update user with otp and expires at
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtpHash: otpHash,
      passwordResetOtpExpiresAt: expiresAt,
      passwordResetOtpAttempts: 0,
    },
  });
  await sendPasswordResetOtp(email, otp.toString());

  return { success: true, message: "OTP sent successfully." };
}

export async function verifyPasswordResetOtp(
  verifyResetOtpDto: VerifyResetOtpDto,
) {
  const email = verifyResetOtpDto.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (
    !user ||
    !user.isActive ||
    !user.passwordResetOtpHash ||
    !user.passwordResetOtpExpiresAt
  ) {
    return { success: false as const, message: "Invalid or expired OTP" };
  }

  if (user.passwordResetOtpExpiresAt < new Date()) {
    return { success: false as const, message: "OTP expired" };
  }

  if (user.passwordResetOtpAttempts >= 5) {
    return { success: false as const, message: "Too many attempts" };
  }

  const isOtpValid = await bcrypt.compare(
    verifyResetOtpDto.otp,
    user.passwordResetOtpHash,
  );
  if (!isOtpValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpAttempts: { increment: 1 },
      },
    });
    return { success: false as const, message: "Invalid OTP" };
  }

  // OTP used — clear it and issue a short-lived reset token for the password step.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtpHash: null,
      passwordResetOtpExpiresAt: null,
      passwordResetOtpAttempts: 0,
    },
  });

  const resetToken = randomBytes(32).toString("hex");
  await redis.set(`passwordResetToken:${resetToken}`, user.id, {
    EX: PASSWORD_RESET_TOKEN_TTL_SECONDS,
  });

  return {
    success: true as const,
    message: "OTP verified successfully",
    resetToken,
  };
}

export async function resetPassword(resetPasswordDto: ResetPasswordDto) {
  const userId = await redis.getDel(
    `passwordResetToken:${resetPasswordDto.resetToken}`,
  );

  if (!userId) {
    return {
      success: false as const,
      message: "Invalid or expired reset token",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    return {
      success: false as const,
      message: "Invalid or expired reset token",
    };
  }

  const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      passwordResetOtpHash: null,
      passwordResetOtpExpiresAt: null,
      passwordResetOtpAttempts: 0,
    },
  });

  const session = await createAuthSession(updatedUser);

  return {
    success: true as const,
    message: "Password reset successfully",
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
  };
}
