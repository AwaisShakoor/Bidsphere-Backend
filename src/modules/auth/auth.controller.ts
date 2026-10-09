import { forgotPassword, getMe, loginUser, logoutUser, refreshToken, registerUser, resetPassword, verifyEmail } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { loginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Request, Response } from "express";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

function handleAuthError(error: unknown, res: Response) {
  const message = error instanceof Error ? error.message : "Internal server error";

  if (message === "User already exists") {
    return res.status(400).json({ message });
  }
  if (message === "Invalid email or password" || message === "Unauthorized") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (message === "User not found") {
    return res.status(404).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

function setAuthCookie(res: Response, token: string, refreshToken: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly:true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  })
}

export async function refresh(req:Request, res:Response) {
  try {
    const refreshTokenCookie  = req.cookies.refreshToken;
    if(!refreshTokenCookie) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await refreshToken(refreshTokenCookie );
    setAuthCookie(res, result.token, result.refreshToken);
    return res.status(200).json({
      message: "Token refreshed successfully",
    });
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function register(req: Request, res: Response) {
  try {
    const data = req.body as RegisterDto;
    const result = await registerUser(data);
    return res.status(201).json(result);
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const data = req.body as VerifyEmailDto;
    const result = await verifyEmail(data);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    setAuthCookie(res, result.token, result.refreshToken);
    return res.status(200).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = req.body as loginDto;
    const result = await loginUser(data);
    setAuthCookie(res, result.token, result.refreshToken);
    return res.status(200).json({
      message: "User Login successfully",
      user: result.user,
    });
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    await logoutUser(req.cookies.refreshToken);
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    return res.status(200).json({
      message: "User Logout successfully",
    });
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function me(req: Request, res: Response) {
  try {
    const token = req.cookies.token;
    if (!token) {
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
    return handleAuthError(error, res);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const data = req.body as ForgotPasswordDto;
    const result = await forgotPassword(data);
    if (!result.success) {
      return res.status(400).json({
        message: result.message,
      });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    return handleAuthError(error, res);
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const data = req.body as ResetPasswordDto;
    const result = await resetPassword(data);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    setAuthCookie(res, result.token, result.refreshToken);
    return res.status(200).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    return handleAuthError(error, res);
  }
}
