import { PollStatusBadge } from '@/components/polls-status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getUsePollQueryOptions, usePollSuspenseQuery } from '@/features/polls/polls.hooks'
import { queryClient } from '@/lib'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArchiveIcon, LockIcon, MoveLeftIcon, Share2Icon } from 'lucide-react'
import z from 'zod'

export const Route = createFileRoute('/admin/polls/$id')({
  beforeLoad: async ({ params }) => {
    await queryClient.ensureQueryData(getUsePollQueryOptions(params))
  },
  component: RouteComponent,
  params: {
    parse: z.object({ id: z.coerce.number() }).parse
  }
})

function RouteComponent() {
  const { id } = Route.useParams()
  const poll = usePollSuspenseQuery({ id })
  return (
    <div className="max-w-4xl mx-auto w-full">
      <Link to="/admin/polls" className="flex gap-2 mb-2">
        <MoveLeftIcon />
        Polls
      </Link>
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">
          {poll.data.question}
        </h1>
        <PollStatusBadge status={poll.data.status} />
      </div>

      <div className="space-x-2 mb-8">
        <Button variant="outline"><LockIcon /> Close poll</Button>
        <Button variant="outline"><Share2Icon /> Share</Button>
        <Button variant="outline"><ArchiveIcon /> Archive</Button>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold">Results</h2>
        <ul className="space-y-6">
          {poll.data.choices.map(x => (
            <li key={x.id}>
              <p>{x.label}</p>
              <Progress value={x.pct} progressIndicatorClassName='bg-blue-500' />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
