export function calcPercentage(total: number, count: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}
