import type { Request, Response } from "express"
import { db } from "../../db/index.js"
import { choicesTable, pollsTable } from "../../db/schema.js"
import z from "zod"
import { and, eq, ilike, like } from "drizzle-orm"

const CreatePollSchema = z.object({
  question: z.string().nonempty(),
  choices: z.array(z.object({ label: z.string() })),
  isDraft: z.boolean()

})

export async function createPoll(req: Request, res: Response) {
  const body = CreatePollSchema.parse(req.body)

  await db.transaction(async (tx) => {
    const status = body.isDraft ? 'draft' : 'open'
    const [poll] = await tx.insert(pollsTable).values({ question: body.question, status }).returning()
    if (!poll) {
      tx.rollback()
      return
    }

    const choices = body.choices.map(x => ({ pollId: poll.id, label: x.label }))
    await tx.insert(choicesTable).values(choices)
  });

  res.status(201).send()
}

export async function listPolls(req: Request, res: Response) {
  const search = req.query.search
  const conditions = [search ? ilike(pollsTable.question, `%${search}%`) : undefined]
  const polls = await db.select().from(pollsTable).where(and(...conditions))
  console.log(polls)
  res.status(200).json(polls)
}


export async function getPoll(req: Request, res: Response) {
  const pollId = z.coerce.number().parse(req.params.id)
  const poll = await db.query.pollsTable.findFirst({
    where: eq(pollsTable.id, pollId),
    with: {
      choices: {
        columns: { id: true, label: true }
      }
    }
  })
  res.status(200).json(poll)
}
