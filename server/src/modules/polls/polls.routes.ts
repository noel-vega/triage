import { Router } from "express";
import { createPoll, getPoll, listPolls } from "./polls.controller.js";


export const pollsRouter = Router()

pollsRouter.post("/", createPoll)
pollsRouter.get("/", listPolls)
pollsRouter.get("/:id", getPoll)






