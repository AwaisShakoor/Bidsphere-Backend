import { prisma } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import bcrypt from "bcrypt";
import { loginDto } from "./dto/login.dto";
import jwt from "jsonwebtoken";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { sendOtpEmail } from "../../utils/mail";

export async function registerUser(registerDto:RegisterDto) {
    const existingUser =await prisma.user.findUnique({
        where : { email: registerDto.email },
    })
    if (existingUser) {
        throw new Error("User already exists");
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await prisma.user.create({
        data: {
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            email: registerDto.email,
            passwordHash: hashedPassword,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
        }
    });
    return user;
}   

export async function loginUser(loginDto: loginDto) {
    const user = await prisma.user.findUnique({
        where: { email: loginDto.email },
    });
    if(!user || !user.isActive) {
        throw new Error('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if(!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

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

    export async function resetPassword(resetPasswordDto:ResetPasswordDto) {
        // Make email consistant
        const email = resetPasswordDto.email.toLowerCase();

        //find user by email
        const user = await prisma.user.findUnique({
            where: { email}
        })

      // 3) No user, inactive, or no OTP saved
    if (!user || !user.isActive || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
        return { success: false, message: "Invalid or expired OTP" };
    }

    //otp older than 10 minutes
    if(user.passwordResetOtpExpiresAt < new Date()) {
        return { success: false, message: "OTP expired" };
    }

    //too many attempts
    if (user.passwordResetOtpAttempts >= 5) {
        return { success: false, message: "Too many attempts" };
    }

    //Compare hashed otp
    const isOtpValid = await bcrypt.compare(resetPasswordDto.otp, user.passwordResetOtpHash);
    if(!isOtpValid) {
        return { success: false, message: "Invalid OTP" };
    }

    //correct otp, reset password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
            passwordResetOtpHash: null,
            passwordResetOtpExpiresAt: null,
            passwordResetOtpAttempts: 0,
        }
    })
    return { success: true, message: "Password reset successfully" };   
}