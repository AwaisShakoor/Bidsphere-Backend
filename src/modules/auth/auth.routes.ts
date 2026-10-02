import{ Router } from "express";
import { login, logout, me, register } from "./auth.controller";


const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.delete("/logout", logout);
authRouter.get("/me", me);

export default authRouter;