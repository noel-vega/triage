import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Link } from "@tanstack/react-router"
import { PollStatusBadge } from "./polls-status-badge"
import type { Poll } from "@/features/shared/types"




export const columns: ColumnDef<Poll>[] = [
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => {
      const { id, question } = row.original
      return <Link to="/admin/polls/$id" params={{ id }} className="hover:text-blue-500 hover:underline">{question}</Link>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <PollStatusBadge status={row.original.status} />
    )
  },

]

export function PollsTable(props: { data: Poll[] }) {
  return (
    <DataTable data={props.data} columns={columns} />
  )
}
