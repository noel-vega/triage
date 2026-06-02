import { Router } from "express";
import { createPoll, getPoll, listPolls } from "./admin.controller.js";

export const adminRouter = Router()

adminRouter.post("/polls", createPoll)
adminRouter.get("/polls", listPolls)
adminRouter.get("/polls/:id", getPoll)






