import { Router } from "express";
import {
  forgotPasswordHandler,
  login,
  logout,
  me,
  refresh,
  register,
  resetPasswordHandler,
  verifyEmailHandler,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmailHandler);
authRouter.post("/login", login);
authRouter.delete("/logout", logout);
authRouter.get("/me", authMiddleware, me);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);
authRouter.post("/refresh", refresh);

export default authRouter;
