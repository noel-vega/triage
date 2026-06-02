import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { fetchCreatePoll, fetchGetPoll, fetchListPolls } from "./admin.api";

export function useCreatePollMutation() {
  return useMutation({
    mutationFn: fetchCreatePoll
  })
}

export function getUseListPollsQueryOptions(params?: { search?: string }) {
  return queryOptions({
    queryKey: ['polls', params],
    queryFn: () => fetchListPolls({ params }),
  })
}

export function useListPollsSuspenseQuery(params?: { search?: string }) {
  return useSuspenseQuery(getUseListPollsQueryOptions(params))
}

export function getUsePollQueryOptions({ id }: { id: number }) {
  return queryOptions({
    queryKey: ['polls', id],
    queryFn: () => fetchGetPoll({ id }),
  })
}

export function usePollSuspenseQuery({ id }: { id: number }) {
  return useSuspenseQuery(getUsePollQueryOptions({ id }))
}
