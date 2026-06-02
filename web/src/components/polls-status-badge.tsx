import type { PollStatus } from "@/features/polls/polls.types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const pollStatus: Record<PollStatus, { label: string, badge: string, dot?: string }> = {
  open: {
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-600 dark:bg-emerald-400",
    label: "Open",
  },
  closed: {
    badge: "bg-muted text-muted-foreground",
    label: "Closed",
  },
  draft: {
    badge: "bg-gray-50 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400",
    dot: "bg-gray-600 dark:bg-gray-400",
    label: "Draft",
  },
}

export function PollStatusBadge({ status }: { status: PollStatus }) {

  const ui = pollStatus[status]

  return <Badge className={cn("flex items-center", ui.badge)}>
    {ui.dot && (
      <span className={cn("h-1.5 w-1.5 rounded-full", ui.dot)} />
    )}
    {ui.label}
  </Badge>

}
