import { buildQuery } from "@/utils"
import z from "zod"
import { PollSchema } from "./polls.types"

const CreatePollSchema = z.object({
  question: z.string(),
  choices: z.array(z.object({ label: z.string() })),
  isDraft: z.boolean()
})


export async function fetchCreatePoll(input: z.infer<typeof CreatePollSchema>) {
  const response = await fetch("http://localhost:3000/polls", {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json"
    }
  })
  const data = await response.json()
  console.log("created:", data)
  return data
}

export async function fetchListPolls({ params }: { params?: { search?: string } }) {
  const q = buildQuery(params)

  const response = await fetch(`http://localhost:3000/polls${q.size > 0 ? `?${q.toString()}` : ""}`)
  const data = await response.json()
  return data
}

export async function fetchGetPoll({ id }: { id: number }) {
  const response = await fetch(`http://localhost:3000/polls/${id}`)
  const data = await response.json()
  return PollSchema.parse(data)
}

export async function fetchSubmitVote({ pollId, choiceId }: { pollId: number, choiceId: number }) {
  const response = await fetch(`http://localhost:3000/polls/${pollId}`, {
    method: "POST",
    body: JSON.stringify({ choiceId }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

