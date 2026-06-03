import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { fetchCastVote, fetchGetPoll } from "./poll.api"
import { useEffect } from "react"
import { PollSchema } from "../shared/types"

export function getUsePollQueryOptions({ id }: { id: number }) {
  return queryOptions({
    queryKey: ['polls', id],
    queryFn: () => fetchGetPoll({ id }),
  })
}

export function usePollSuspenseQuery({ id }: { id: number }) {
  return useSuspenseQuery(getUsePollQueryOptions({ id }))
}

export function useCastVoteMutation() {
  return useMutation({
    mutationFn: fetchCastVote
  })
}


export function usePollStream(id: number) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:3000/polls/${id}/stream`)
    eventSource.onmessage = (e) => {
      console.log(e.data)
      const results = PollSchema.parse(JSON.parse(e.data))
      queryClient.setQueryData(["polls", id], results)  // feed the existing query cache
    }
    eventSource.onerror = () => { /* EventSource auto-reconnects; optionally surface a 'reconnecting' state */ }
    return () => eventSource.close()
  }, [id, queryClient])
}
