import { prisma } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import bcrypt from "bcrypt";
import { loginDto } from "./dto/login.dto";
import jwt from "jsonwebtoken";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { sendOtpEmail } from "../../utils/mail";
import { VerifyEmailDto } from "./dto/verify-email.dto";

export async function registerUser(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpHash = await bcrypt.hash(otp.toString(), 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
        data: {
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            email,
            passwordHash: hashedPassword,
            isActive: false,
            emailVerifyOtpHash: otpHash,
            emailVerifyOtpExpiresAt: expiresAt,
            emailVerifyOtpAttempts: 0,
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

    await sendOtpEmail(email, otp.toString());

    return {
        message: "OTP sent to email. Please verify to activate account.",
        user,
    };
}

function createAuthSession(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: Date;
}) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: '1d' }
    );

    return {
      token,
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
        user.emailVerifyOtpHash
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

    const session = createAuthSession(activatedUser);

    return {
        success: true as const,
        message: "Email verified successfully",
        token: session.token,
        user: session.user,
    };
}   

export async function loginUser(loginDto: loginDto) {
    const email = loginDto.email.toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if(!user || !user.isActive) {
        throw new Error('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if(!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    return createAuthSession(user);
}

export async function getMe(token:string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }

    const payload = jwt.verify(token, secret) as { userId: string; role: string };

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
    });
    if(!user) {
        throw new Error('User not found');
    }
    return user;
}

export async function forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    // Make email consistant
    const email = forgotPasswordDto.email.toLowerCase();

    //find user by email
    const user = await prisma.user.findUnique({
        where: { email}
    })

    //check if user exists
    if(!user || !user.isActive) {
        return { success: false, message: 'User not found' };
    }

    //create 6 digit otp
    const otp = Math.floor(100000 + Math.random() * 900000);

    //hash otp
    const otpHash = await bcrypt.hash(otp.toString(), 10);

    //Expires in 10 minutes
    const expiresAt =  new Date(Date.now() + 10 * 60 * 1000);

    //update user with otp and expires at
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetOtpHash: otpHash,
            passwordResetOtpExpiresAt: expiresAt,
            passwordResetOtpAttempts: 0,
        }
    })
    await sendOtpEmail(email, otp.toString());

    return { success: true, message: 'OTP sent to email' };
}

export async function resetPassword(resetPasswordDto: ResetPasswordDto) {
    const email = resetPasswordDto.email.toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.isActive || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
        return { success: false as const, message: "Invalid or expired OTP" };
    }

    if (user.passwordResetOtpExpiresAt < new Date()) {
        return { success: false as const, message: "OTP expired" };
    }

    if (user.passwordResetOtpAttempts >= 5) {
        return { success: false as const, message: "Too many attempts" };
    }

    const isOtpValid = await bcrypt.compare(resetPasswordDto.otp, user.passwordResetOtpHash);
    if (!isOtpValid) {
        return { success: false as const, message: "Invalid OTP" };
    }

    //correct otp, reset password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
            passwordResetOtpHash: null,
            passwordResetOtpExpiresAt: null,
            passwordResetOtpAttempts: 0,
        }
    })

    const session = createAuthSession(updatedUser);

    return {
        success: true as const,
        message: "Password reset successfully",
        token: session.token,
        user: session.user,
    };
}