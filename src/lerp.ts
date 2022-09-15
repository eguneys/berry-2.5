export function lerp(a, b, x = 0.5) {
  return a * (1 - x) + b * x
}

export function lerp_dt(f, dt, a, b) {
  return lerp(a, b, 1 - Math.pow(f, dt))
}

export function appr(a, b, by) {
  if (a < b) { return Math.min(a + by, b) }
  if (a > b) { return Math.max(a - by, b) }
  return b
}
