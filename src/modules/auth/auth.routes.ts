import{ Router } from "express";
import { forgotPasswordHandler, login, logout, me, register, resetPasswordHandler, verifyEmailHandler } from "./auth.controller";


const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmailHandler);
authRouter.post("/login", login);
authRouter.delete("/logout", logout);
authRouter.get("/me", me);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler)

export default authRouter;