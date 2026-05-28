import { Router } from "express";
import { signin } from "./auth.controllers.js";

export const authRouter = Router()

authRouter.post('/signin', signin);
