import EventEmitter from "events";
import type { PollResults } from "./poll.types.js";


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
  }
}
