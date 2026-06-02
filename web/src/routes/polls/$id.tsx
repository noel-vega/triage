import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field'
import { Item, ItemContent, ItemMedia } from '@/components/ui/item'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getUsePollQueryOptions, usePollSuspenseQuery } from '@/features/polls/polls.hooks'
import { queryClient } from '@/lib'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute('/polls/$id')({
  beforeLoad: async ({ params }) => {
    await queryClient.ensureQueryData(getUsePollQueryOptions(params))
  },
  component: RouteComponent,
  params: {
    parse: z.object({ id: z.coerce.number() }).parse
  },
})

const VoteSchema = z.object({
  choiceId: z.number()
})

function RouteComponent() {
  const { id } = Route.useParams()
  const poll = usePollSuspenseQuery({ id })

  const form = useForm({
    resolver: zodResolver(VoteSchema),
    defaultValues: { choiceId: undefined }
  })

  const handleSubmit = (data: z.infer<typeof VoteSchema>) => {
    console.log(data)

  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold">
        {poll.data.question}
      </h1>
      <p className="mb-6 text-muted-foreground">Choose one. Your vote is anonymous.</p>

      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <Controller
          control={form.control}
          name="choiceId"
          render={({ field }) => (
            <RadioGroup
              value={field.value ?? null}
              onValueChange={field.onChange}
              ref={field.ref}
            >
              {poll.data.choices.map(x => (
                <label key={x.id} className="hover:cursor-pointer">
                  <Item variant="outline" className="bg-card">
                    <ItemMedia>
                      <RadioGroupItem value={x.id} id={x.id.toString()} />
                    </ItemMedia>
                    <ItemContent>
                      {x.label}
                    </ItemContent>
                  </Item>
                </label>
              ))}
            </RadioGroup>
          )}
        />

        <Button type="submit">Submit vote</Button>

        <div>
          <span>{poll.data.total} votes</span>
        </div>
      </form>
    </div>
  )
}
