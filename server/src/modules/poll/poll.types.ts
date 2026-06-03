import type { pollStatus } from "../../db/schema.js"
import type { getPoll } from "./poll.service.js"

export type PollResults = NonNullable<Awaited<ReturnType<typeof getPoll>>>
export type PollStatus = (typeof pollStatus.enumValues)[number]
