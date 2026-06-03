import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod';
import { GripVerticalIcon, MoveLeftIcon, PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreatePollMutation } from '@/features/admin/admin.hooks'

export const Route = createFileRoute('/admin/polls/create')({
  component: RouteComponent,
})

const CreatePollFormSchema = z.object({
  question: z.string().nonempty(),
  choices: z
    .array(z.object({ label: z.string().min(1, "Choice can't be empty") }))
    .min(2, "Add at least two choices"),
})

function RouteComponent() {
  const createPoll = useCreatePollMutation()
  const form = useForm({
    resolver: zodResolver(CreatePollFormSchema),
    defaultValues: {
      question: "",
      choices: [{ label: "" }, { label: "" }]
    }
  })

  const choices = useFieldArray({ control: form.control, name: "choices" })


  const onSubmit = ({ isDraft }: { isDraft: boolean }) => (data: z.infer<typeof CreatePollFormSchema>) => {
    createPoll.mutate({ ...data, isDraft })
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <Link to="/admin/polls" className="flex gap-2 mb-2">
        <MoveLeftIcon />
        Polls
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create Poll</h1>

      <form>
        <Controller
          name="question"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="mb-4">
              <FieldLabel htmlFor={field.name}>Question</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <FieldGroup>
          <Field>
            <FieldLabel>Choices</FieldLabel>
            <ul className="space-y-2">
              {choices.fields.map((field, index) => (
                <li key={field.id} className="flex gap-2 items-center">
                  <div><GripVerticalIcon /></div>
                  <Input
                    key={field.id}
                    {...form.register(`choices.${index}.label`)}
                  />
                  <Button type="button" onClick={() => choices.remove(index)}><XIcon /></Button>
                </li>
              ))}
            </ul>
          </Field>
          <Button className="w-fit" onClick={() => choices.append({ label: "" })}><PlusIcon />Add choice</Button>
          <p>At least two choices required.</p>
        </FieldGroup>

        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="ghost">Cancel</Button>
          <Button type="button" variant="outline" onClick={form.handleSubmit(onSubmit({ isDraft: true }))}>Save as draft</Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit({ isDraft: false }))}>Create & open</Button>
        </div>

      </form>
    </div>

  )
}


