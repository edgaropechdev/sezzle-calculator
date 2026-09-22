// Display formatting. The API deliberately does not round — it answers
// 0.30000000000000004 for 0.1 + 0.2 — so rounding for a human is the client's
// job, and it happens here and nowhere else.

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 })

export function formatNumber(value: number): string {
  return formatter.format(value)
}
