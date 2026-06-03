import { PollsTable } from '@/components/polls-table'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { getUseListPollsQueryOptions, useListPollsSuspenseQuery } from '@/features/admin/admin.hooks'
import { queryClient } from '@/lib'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon, SearchIcon } from 'lucide-react'
import { Suspense, useDeferredValue, useState } from 'react'

export const Route = createFileRoute('/admin/polls/')({
  beforeLoad: async () => {
    await queryClient.ensureQueryData(getUseListPollsQueryOptions())
  },
  component: RouteComponent,
})

function RouteComponent() {

  return (
    <div className="max-w-4xl mx-auto w-full">
      <Suspense fallback="Loading">
        <Polls />
      </Suspense>
    </div>
  )
}


function Polls() {
  const [search, setSearch] = useState<string>("")
  const value = useDeferredValue(search)
  const { data, error, isError } = useListPollsSuspenseQuery({ search: value })

  if (isError) {
    console.log(error.message)
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Polls</h1>
          <p>Manage and track every poll</p>
        </div>

        <Link to="/admin/polls/create">
          <Button>
            <PlusIcon /> Create poll
          </Button>
        </Link>
      </header>

      <div className="mb-6">
        <InputGroup className="bg-card">
          <InputGroupInput placeholder="Search..." onInput={(e) => setSearch(e.currentTarget.value)} value={search} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <PollsTable data={data ?? []} />
    </div>
  )
}
