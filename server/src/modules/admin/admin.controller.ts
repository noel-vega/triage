import type { Request, Response } from "express"
import z from "zod"

import * as pollService from "../poll/poll.service.js"

export async function createPoll(req: Request, res: Response) {
  const body = pollService.CreatePollInputSchema.parse(req.body)
  await pollService.createPoll(body)
  res.status(201).send()
}

export async function listPolls(req: Request, res: Response) {
  const queryParams = pollService.ListPollsParamsSchema.parse(req.query)
  const polls = await pollService.listPolls(queryParams)
  res.status(200).json(polls)
}

export async function getPoll(req: Request, res: Response) {
  const id = z.coerce.number().parse(req.params.id)
  const poll = await pollService.getPoll({ id })
  if (!poll) {
    res.status(404).send()
    return
  }

  res.status(200).json(poll)
}
