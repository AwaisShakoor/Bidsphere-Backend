import { Router } from "express";
import {
  forgotPasswordHandler,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerificationHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  verifyResetOtpHandler,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmailHandler);
authRouter.post("/resend-otp", resendVerificationHandler);
authRouter.post("/login", login);
authRouter.delete("/logout", logout);
authRouter.get("/me", authMiddleware, me);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/verify-reset-otp", verifyResetOtpHandler);
authRouter.post("/reset-password", resetPasswordHandler);
authRouter.post("/refresh", refresh);

export default authRouter;
