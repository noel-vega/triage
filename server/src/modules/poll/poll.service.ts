import z from "zod"
import { db } from "../../db/index.js"
import { choicesTable, pollsTable, votesTable } from "../../db/schema.js"
import { ilike, and, sql, eq, asc } from "drizzle-orm"
import { calcPercentage } from "../../utils.js"
import { pollEvents } from "./poll.events.js"

export const CreatePollInputSchema = z.object({
  question: z.string().nonempty(),
  choices: z.array(z.object({ label: z.string() })).min(2),
  isDraft: z.boolean()
})

type CreatePollInput = z.infer<typeof CreatePollInputSchema>

export async function createPoll(input: CreatePollInput) {
  await db.transaction(async (tx) => {
    const status = input.isDraft ? 'draft' : 'open'
    const [poll] = await tx.insert(pollsTable).values({ question: input.question, status }).returning()
    if (!poll) {
      tx.rollback()
      return
    }

    const choices = input.choices.map(x => ({ pollId: poll.id, label: x.label }))
    await tx.insert(choicesTable).values(choices)
  })
}


export const ListPollsParamsSchema = z.object({
  search: z.string().optional()
})
export type ListPollsParams = z.infer<typeof ListPollsParamsSchema>

export async function listPolls(params?: ListPollsParams) {
  const conditions = [params?.search ? ilike(pollsTable.question, `%${params?.search}%`) : undefined]
  const polls = await db.select().from(pollsTable).where(and(...conditions))
  return polls;
}

export async function getPoll({ id }: { id: number }) {
  const poll = await db.query.pollsTable.findFirst({
    where: eq(pollsTable.id, id)
  })

  if (!poll) {
    return undefined
  }

  const rows = await getPollResults({ pollId: poll.id })

  const total = rows.reduce((acc, curr) => acc + curr.votes, 0)
  const choices = rows.map(x => ({
    ...x,
    pct: calcPercentage(total, x.votes),
  }))

  return {
    id: poll.id,
    question: poll.question,
    status: poll.status,
    total,
    choices
  }
}


export const CastVoteSchema = z.object({
  pollId: z.number(),
  choiceId: z.number(),
})
export async function castVote(input: { pollId: number; choiceId: number }) {
  const current = await getPoll({ id: input.pollId })
  if (!current) return undefined            // → 404
  if (current.status !== "open") return current  // → 409, nothing inserted/published

  await db.insert(votesTable).values(input)
  const results = await getPoll({ id: input.pollId })
  pollEvents.publish(input.pollId, results!)
  return results
}



export async function getPollResults({ pollId }: { pollId: number }) {
  return db
    .select({
      id: choicesTable.id,
      label: choicesTable.label,
      votes: sql<number>`count(${votesTable.id})::int`,
    })
    .from(choicesTable)
    .leftJoin(votesTable, eq(votesTable.choiceId, choicesTable.id))
    .where(eq(choicesTable.pollId, pollId))
    .groupBy(choicesTable.id, choicesTable.label)
    .orderBy(asc(choicesTable.id))
}
