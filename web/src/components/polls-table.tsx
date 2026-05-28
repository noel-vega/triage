import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Link } from "@tanstack/react-router"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"
import type { Poll } from "@/features/polls/polls.types"


export const columns: ColumnDef<Poll>[] = [
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => {
      const { id, question } = row.original
      return <Link to="/polls/$id" params={{ id }} className="hover:text-blue-500 hover:underline">{question}</Link>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original
      return <Badge variant={status !== "open" ? "ghost" : "default"}
        className={cn("flex items-center", { "bg-emerald-50 text-emerald-700": status === "open" })}

      >
        {status === "open" && (
          <span className={cn("h-1.5 w-1.5 rounded-full", "bg-emerald-600")} />
        )}
        {status}
      </Badge>
    }
  },

]

export function PollsTable(props: { data: Poll[] }) {
  return (
    <DataTable data={props.data} columns={columns} />
  )
}
