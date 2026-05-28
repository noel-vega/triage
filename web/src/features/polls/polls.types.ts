import z from "zod"


export const PollStatusSchema = z.literal("draft").or(z.literal("open")).or(z.literal("closed"))
export type PollStatus = z.infer<typeof PollStatusSchema>

export const PollSchema = z.object({
  id: z.number(),
  question: z.string(),
  status: PollStatusSchema
})
export type Poll = z.infer<typeof PollSchema>

export const PollChoice = z.object({ id: z.number(), label: z.string() })

export const PollWithChoicesSchema = PollSchema.extend({ choices: PollChoice.array() })
export type PollWithChoices = z.infer<typeof PollWithChoicesSchema>
