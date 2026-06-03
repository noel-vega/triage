import { buildQuery } from "@/utils"
import z from "zod"
import { PollListItemSchema, PollSchema } from "@/features/shared/types"

const CreatePollSchema = z.object({
  question: z.string(),
  choices: z.array(z.object({ label: z.string() })),
  isDraft: z.boolean()
})


export async function fetchCreatePoll(input: z.infer<typeof CreatePollSchema>) {
  await fetch("http://localhost:3000/admin/polls", {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export async function fetchListPolls({ params }: { params?: { search?: string } }) {
  const q = buildQuery(params)

  const response = await fetch(`http://localhost:3000/admin/polls${q.size > 0 ? `?${q.toString()}` : ""}`)
  const data = await response.json()
  return PollListItemSchema.array().parse(data)
}

export async function fetchGetPoll({ id }: { id: number }) {
  const response = await fetch(`http://localhost:3000/admin/polls/${id}`)
  const data = await response.json()
  return PollSchema.parse(data)
}


