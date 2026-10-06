import { forgotPassword, getMe, loginUser, registerUser, resetPassword } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { loginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Request, Response } from "express";
import { ResetPasswordDto } from "./dto/reset-password.dto";

export async function register(req: Request, res: Response) {
try {
    const data = req.body as RegisterDto;
    const user = await registerUser(data);
    return res.status(201).json({
        message: "User registered successfully",
        user,
    });
} catch (error) {
    return res.status(500).json({
        message: "Internal server error",
    });
}
}

export async function login(req: Request, res: Response) {
    try {
        const data = req.body as loginDto;
        const result = await loginUser(data);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day (match JWT)
        });
        return res.status(200).json({
            message: "User Login successfully",
            user: result.user,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function logout(_req: Request, res: Response) {
    try {
        res.clearCookie('token');
        return res.status(200).json({
            message: "User Logout successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function me(req: Request, res: Response) {
    try {
        const token = req.cookies.token;
        if(!token) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const user = await getMe(token);
        return res.status(200).json({
            message: "User details",
            user,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function forgotPasswordHandler(req: Request, res:Response){
    try {
        const data = req.body as ForgotPasswordDto;
        const result = await forgotPassword(data);
        if (!result.success) {
            return res.status(400).json({
                message: result.message,
            })
        }
        return res.status(200).json({ message: result.message})
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function resetPasswordHandler(req: Request, res:Response) {
    try {
        const data = req.body as ResetPasswordDto;
        const result = await resetPassword(data);
        if (!result.success) {
         return res.status(400).json({ message: result.message})
        }
        return res.status(200).json({ message: result.message })
    } catch (error) {
        return res.status(500).json ({ message: "Internal server error"})
    }
}