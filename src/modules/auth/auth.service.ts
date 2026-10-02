import { prisma } from "../../config/db";
import { RegisterDto } from "./dto/register.dto";
import bcrypt from "bcrypt";
import { loginDto } from "./dto/login.dto";
import jwt from "jsonwebtoken";

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