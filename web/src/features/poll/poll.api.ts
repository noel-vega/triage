import { PollSchema } from "@/features/shared/types"

export async function fetchGetPoll({ id }: { id: number }) {
  const response = await fetch(`http://localhost:3000/polls/${id}`)
  const data = await response.json()
  return PollSchema.parse(data)
}

export async function fetchCastVote({ pollId, choiceId }: { pollId: number, choiceId: number }) {
  await fetch(`http://localhost:3000/polls/${pollId}/votes`, {
    method: "POST",
    body: JSON.stringify({ choiceId }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
