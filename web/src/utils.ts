
export type QueryParams = Record<string, any>

export function buildQuery(params?: QueryParams) {
  const qp = new URLSearchParams()

  if (!params) return qp

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qp.append(key, value)
    }
  }
  return qp
}
