export function lerp(a, b, x = 0.5) {
  return a + (b - a) * x
}

export function appr(a, b, by) {
  if (a < b) { return Math.min(a + by, b) }
  if (a > b) { return Math.max(a - by, b) }
  return b
}
