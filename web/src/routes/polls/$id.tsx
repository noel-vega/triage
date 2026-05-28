import { Progress } from '@/components/ui/progress'
import { getUsePollQueryOptions, usePollSuspenseQuery } from '@/features/polls/polls.hooks'
import { queryClient } from '@/lib'
import { createFileRoute, Link } from '@tanstack/react-router'
import { MoveLeftIcon } from 'lucide-react'
import z from 'zod'

export const Route = createFileRoute('/polls/$id')({
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
      <Link to="/polls" className="flex gap-2 mb-2">
        <MoveLeftIcon />
        Polls
      </Link>
      <h1 className="text-3xl font-bold">
        {poll.data.question}
      </h1>

      <div>
        <h2>Results</h2>
        <ul>
          {poll.data.choices.map(x => (
            <li key={x.id}>
              <p>{x.label}</p>
              <Progress value={50} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
