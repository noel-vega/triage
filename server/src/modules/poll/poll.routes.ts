

import { Router } from "express";
import { castVote, getPoll, streamPoll } from "./poll.controller.js";


export const pollRouter = Router()

pollRouter.get("/:id", getPoll)
pollRouter.post("/:id/votes", castVote)
pollRouter.get("/:id/stream", streamPoll)
