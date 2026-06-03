import type { Request, Response } from "express"
import z from "zod"
import * as pollService from "./poll.service.js"
import { pollEvents } from "./poll.events.js"
import type { PollResults } from "./poll.types.js"

export async function getPoll(req: Request, res: Response) {
  const id = z.coerce.number().parse(req.params.id)
  const poll = await pollService.getPoll({ id })
  if (!poll || poll.status != "open") {
    res.status(404).send()
    return
  }

  res.status(200).json(poll)
}

export async function castVote(req: Request, res: Response) {
  const pollId = z.coerce.number().parse(req.params.id)
  const vote = pollService.CastVoteSchema.parse({ pollId, ...req.body })
  const poll = await pollService.castVote(vote)

  if (!poll) {
    res.status(404).send()
    return
  }

  if (poll.status !== "open") {
    res.status(409).send()
    return
  }

  res.status(201).send()
}

export async function streamPoll(req: Request, res: Response) {
  const id = z.coerce.number().parse(req.params.id)

  const snapshot = await pollService.getPoll({ id })
  if (!snapshot || snapshot.status !== "open") {
    res.status(404).end();
    return
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  })
  res.flushHeaders?.()

  const send = (results: PollResults) => res.write(`data: ${JSON.stringify(results)}\n\n`)

  // 1. initial snapshot so the client is correct on connect
  send(snapshot)

  // 2. live updates
  const unsubscribe = pollEvents.subscribe(id, send)

  // 3. heartbeat keeps proxies from closing idle connections
  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 15_000)

  // 4. cleanup
  req.on("close", () => { clearInterval(heartbeat); unsubscribe(); res.end() })

}
