# Realtime Poll Results — Fullstack Gameplan (SSE)

## Goal

- An **admin** can create polls and watch vote tallies update **in realtime**.
- A **voter**, after casting a vote, sees results update **in realtime** (their own vote and everyone else's).

## Why Server-Sent Events (SSE)

The data flow is one-directional. Votes travel **up** as a one-off `POST`; only **tallies** travel **down** as a continuous stream. That is exactly what SSE is for.

| Concern | SSE (chosen) | WebSockets | Polling |
| --- | --- | --- | --- |
| Direction | server → client (fits) | bidirectional (unused half) | client pulls |
| Dependencies | none (plain HTTP + `EventSource`) | needs `ws`/`socket.io` | none |
| Reconnect | automatic (`EventSource`) | hand-rolled | n/a |
| Multiple subscribers | trivial (per-poll broadcast) | trivial | wasteful |
| Realtime feel | yes | yes | laggy / noisy |

We do **not** need WebSockets because no client ever pushes over a persistent connection. Polling is ruled out because the explicit goal is realtime and an always-open admin dashboard would poll wastefully.

---

## Architecture overview

```
                      POST /polls/:id/votes
   Voter browser  ───────────────────────────────►  Express
        ▲                                              │  insert vote (Drizzle/Postgres)
        │  SSE: GET /polls/:id/stream                  │  recompute tally
        └──────────────◄───────────────────┐          │  pollEvents.emit(`poll:<id>`)
                                            │          ▼
   Admin browser ──────────◄───────────── SSE handlers subscribed to pollEvents
        (GET /admin/stream — all polls)     (write `data: <results>\n\n` to each open response)
```

- **`pollEvents`** — a tiny in-process pub/sub (Node `EventEmitter`) keyed by poll id.
- **Vote handler** inserts the vote, recomputes the poll's results, and emits an event.
- **SSE handlers** hold open HTTP responses; on each event they write the fresh results.
- **Clients** open an `EventSource`, and on each message push the payload into the TanStack Query cache so the existing UI re-renders.

> **Scaling note (call this out in the README / interview):** `EventEmitter` is **single-process**. With more than one Node instance, a vote on instance A won't reach a subscriber on instance B. The production path is **Postgres `LISTEN/NOTIFY`** (we already use Postgres — near-zero added infra) or **Redis pub/sub**. The `pollEvents` module is the seam: swap its implementation, the rest of the code is unchanged. We ship the in-memory version and document the swap.

---

## Decisions

| Decision | Choice | Notes |
| --- | --- | --- |
| Transport | **SSE** | confirmed |
| Vote dedup | **One vote per browser** (recommended) | `voterId` in `localStorage` + unique constraint `(poll_id, voter_id)`. No auth required. Trivially bypassable (incognito) — acceptable pre-auth. Swap to `unlimited` by dropping the constraint, or to per-user once auth lands. |
| Tally computation | **Recompute on each vote** | Reuses `getPollResults`; simple and correct at demo scale. Optimize to in-memory counters only if needed. |
| Payload shape | **Same as `GET /polls/:id`** | `{ id, question, status, total, choices: [{ id, label, votes, pct }] }` so the client reuses `PollSchema` for both initial load and stream messages. |

---

## Phase 1 — Voting (server prerequisite)

Realtime is meaningless until votes can be written. There is currently **no vote endpoint** and `votesTable` is never written to.

**Schema** (`server/src/db/schema.ts`)
- Make vote FKs required and cascade: `pollId`/`choicesId` → `.notNull()` + `references(..., { onDelete: "cascade" })`.
- Add `voterId: varchar({ length: 64 }).notNull()` (for one-per-browser dedup).
- Add a unique constraint `unique("votes_poll_voter_uq").on(votesTable.pollId, votesTable.voterId)`.
- Generate + run a migration (`npm run migration:new`).

**Service** (`server/src/modules/poll/poll.service.ts`)
```ts
export const CastVoteInputSchema = z.object({
  pollId: z.number().int(),
  choiceId: z.number().int(),
  voterId: z.string().min(1).max(64),
})
type CastVoteInput = z.infer<typeof CastVoteInputSchema>

export async function castVote(input: CastVoteInput) {
  // 1. load poll; reject if missing or status !== "open"  -> throw typed error
  // 2. verify choiceId belongs to pollId                  -> throw typed error
  // 3. insert vote; rely on unique (poll_id, voter_id) to block repeats
  //    (.onConflictDoNothing() OR catch the unique violation -> 409)
  // 4. return getPoll({ id: pollId })  // fresh results for broadcast
}
```

**Controller / route**
- `POST /polls/:id/votes`, body `{ choiceId, voterId }`.
- Map domain errors to status codes: `404` poll not found, `409` already voted / poll closed, `400` bad choice.
- After a successful vote, call `pollEvents.publish(pollId, results)` (Phase 2).

**Tests** (`server/src/modules/poll/poll.test.ts`)
- vote increments the right choice's tally.
- second vote from the same `voterId` → `409`.
- vote on a `draft`/`closed` poll → rejected.
- vote with a `choiceId` from another poll → `400`.

---

## Phase 2 — Broadcast layer (server)

**`server/src/modules/poll/poll.events.ts`** — the pub/sub seam.
```ts
import { EventEmitter } from "node:events"
type PollResults = Awaited<ReturnType<typeof getPoll>>

const emitter = new EventEmitter()
emitter.setMaxListeners(0) // many concurrent SSE subscribers

export const pollEvents = {
  publish(pollId: number, results: PollResults) {
    emitter.emit(`poll:${pollId}`, results)
  },
  subscribe(pollId: number, fn: (r: PollResults) => void) {
    const evt = `poll:${pollId}`
    emitter.on(evt, fn)
    return () => emitter.off(evt, fn)   // unsubscribe
  },
}
```

**SSE endpoint** — `GET /polls/:id/stream`
```ts
export async function streamPoll(req: Request, res: Response) {
  const id = z.coerce.number().parse(req.params.id)

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  })
  res.flushHeaders?.()

  const send = (results: unknown) => res.write(`data: ${JSON.stringify(results)}\n\n`)

  // 1. initial snapshot so the client is correct on connect
  const snapshot = await pollService.getPoll({ id })
  if (!snapshot || snapshot.status !== "open") { res.status(404).end(); return }
  send(snapshot)

  // 2. live updates
  const unsubscribe = pollEvents.subscribe(id, send)

  // 3. heartbeat keeps proxies from closing idle connections
  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 15_000)

  // 4. cleanup
  req.on("close", () => { clearInterval(heartbeat); unsubscribe(); res.end() })
}
```

- Route: `pollRouter.get("/:id/stream", streamPoll)`.
- **Admin "all polls" stream** (optional, for the dashboard): `GET /admin/stream` subscribes to every poll's events (or a wildcard channel `poll:*`) and tags each message with its `pollId`. Same mechanics, broader subscription.
- Wire the vote handler from Phase 1 to call `pollEvents.publish(id, freshResults)`.

> **CORS for SSE:** the existing `app.use(cors())` covers the `EventSource` request (it's a simple GET). No extra config needed for local dev.

---

## Phase 3 — Client (web)

**Fix the existing bug:** `web/src/features/poll/poll.api.ts:4` fetches `/admin/polls/:id` — the public page should hit `/polls/:id`.

**Voter id** — `web/src/features/poll/voter-id.ts`
```ts
export function getVoterId() {
  let id = localStorage.getItem("voterId")
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("voterId", id) }
  return id
}
```

**Cast a vote** — `poll.api.ts`
```ts
export async function postVote({ id, choiceId }: { id: number; choiceId: number }) {
  const res = await fetch(`http://localhost:3000/polls/${id}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choiceId, voterId: getVoterId() }),
  })
  if (!res.ok) throw new Error(`vote failed: ${res.status}`) // 409 = already voted
}
```
Use a `useMutation` in `poll.hooks.ts`; replace the `console.log(data)` in `web/src/routes/polls/$id.tsx:34` with the mutation call.

**Subscribe to the stream** — `poll.hooks.ts`
```ts
export function usePollStream(id: number) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const es = new EventSource(`http://localhost:3000/polls/${id}/stream`)
    es.onmessage = (e) => {
      const results = PollSchema.parse(JSON.parse(e.data))
      queryClient.setQueryData(["polls", id], results)  // feed the existing query cache
    }
    es.onerror = () => { /* EventSource auto-reconnects; optionally surface a 'reconnecting' state */ }
    return () => es.close()
  }, [id, queryClient])
}
```
Key idea: **the SSE stream writes into the same query key the page already reads** (`["polls", id]`). The Suspense query stays the source of truth; the stream just keeps it fresh. No component rewiring beyond calling `usePollStream(id)`.

**Render tallies** — in `web/src/routes/polls/$id.tsx`, after a vote, show each choice's `votes` and a bar using the `pct` the server already returns. Before voting, show the radio options; after voting (or if already voted), show the live results view.

**Admin dashboard** — a route that opens `GET /admin/stream` and renders every poll's tallies updating live (same `EventSource` + `setQueryData` pattern, keyed per poll).

---

## Phase 4 — Verify

1. Start Postgres, run the new migration.
2. `cd server && npm run dev` and `cd web && npm run dev`.
3. Open the voter page in **two browser tabs** (or one normal + one incognito for distinct `voterId`s).
4. Vote in tab A → tab B's tally updates within a frame, no refresh.
5. Open the admin dashboard → it reflects votes from both tabs live.
6. Re-vote from the same browser → blocked with `409`.
7. Run `cd server && npm test` — vote + dedup tests green.

**Demo script for the hiring manager:** "Votes are a normal POST; results stream back over SSE. The broadcast layer is a one-module seam — in-memory `EventEmitter` today, swappable for Postgres `LISTEN/NOTIFY` to scale horizontally. The client pipes stream messages straight into the TanStack Query cache, so the same component renders both the initial load and live updates."

---

## File checklist

**Server**
- `server/src/db/schema.ts` — vote FKs `notNull` + cascade, `voterId`, unique `(poll_id, voter_id)`
- `server/drizzle/…` — new migration
- `server/src/modules/poll/poll.events.ts` — **new** pub/sub seam
- `server/src/modules/poll/poll.service.ts` — `castVote`, `CastVoteInputSchema`
- `server/src/modules/poll/poll.controller.ts` — `castVote`, `streamPoll` handlers
- `server/src/modules/poll/poll.routes.ts` — `POST /:id/votes`, `GET /:id/stream`
- `server/src/modules/poll/poll.test.ts` — **new** vote/dedup tests
- (optional) `server/src/modules/admin/…` — `GET /admin/stream`

**Web**
- `web/src/features/poll/voter-id.ts` — **new**
- `web/src/features/poll/poll.api.ts` — fix URL, add `postVote`
- `web/src/features/poll/poll.hooks.ts` — `useVoteMutation`, `usePollStream`
- `web/src/routes/polls/$id.tsx` — wire vote mutation + live results bars
- (optional) `web/src/routes/admin/…` — realtime dashboard

---

## Open items / future work

- **Auth** (deferred): once it lands, replace `voterId` with the authenticated user id and move dedup to `(poll_id, user_id)`.
- **Horizontal scale**: swap `poll.events.ts` for Postgres `LISTEN/NOTIFY` or Redis pub/sub.
- **Close/expire polls**: streaming should end (or send a final `closed` event) when a poll's status leaves `open`.
- **Backpressure / limits**: cap concurrent SSE connections per IP if this were public.
