import z from "zod"


export const PollStatusSchema = z.literal("draft").or(z.literal("open")).or(z.literal("closed"))
export type PollStatus = z.infer<typeof PollStatusSchema>

export const PollListItemSchema = z.object({
  id: z.number(),
  question: z.string(),
  status: PollStatusSchema
})
export type PollListItem = z.infer<typeof PollListItemSchema>




export const PollChoice = z.object({ id: z.number(), label: z.string(), votes: z.number(), pct: z.number() })

export const PollSchema = z.object({
  id: z.number(),
  question: z.string(),
  status: PollStatusSchema,
  total: z.number(),
  choices: PollChoice.array()
})
export type Poll = z.infer<typeof PollSchema>
