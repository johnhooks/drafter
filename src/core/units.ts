declare const brand: unique symbol
/** Length in sixteenths of an inch. Integer, always. */
export type Sixteenths = number & { readonly [brand]: 'Sixteenths' }

export const sx = (n: number): Sixteenths => n as Sixteenths
export const inches = (n: number): Sixteenths => sx(Math.round(n * 16))

export type ParseResult = { ok: true; value: Sixteenths } | { ok: false; error: string }

const FRACTION = /^(\d+)\/(\d+)$/
const DECIMAL = /^\d+(\.\d+)?$/

export function parseLength(input: string): ParseResult {
  let s = input.trim().replace(/(?:"|″|\s*in(?:ch(?:es)?)?)$/i, '').trim()
  if (s === '') return { ok: false, error: 'Enter a length' }
  if (s.startsWith('-')) return { ok: false, error: 'Length cannot be negative' }

  // "35 1/4" or "35-1/4": whole part then a fraction
  const mixed = /^(\d+)[\s-]+(\d+)\/(\d+)$/.exec(s)
  if (mixed) {
    const whole = Number(mixed[1])
    const frac = fraction(Number(mixed[2]), Number(mixed[3]))
    if (frac === null) return { ok: false, error: 'Fraction must be a multiple of 1/16 with a non-zero denominator' }
    return { ok: true, value: sx(whole * 16 + frac) }
  }
  const bare = FRACTION.exec(s)
  if (bare) {
    const frac = fraction(Number(bare[1]), Number(bare[2]))
    if (frac === null) return { ok: false, error: 'Fraction must be a multiple of 1/16 with a non-zero denominator' }
    return { ok: true, value: sx(frac) }
  }
  if (DECIMAL.test(s)) return { ok: true, value: inches(Number(s)) }
  return { ok: false, error: 'Not a length. Try 35 1/4, 35.25, or 3/4' }
}

/** Fraction to sixteenths, rounding to the nearest sixteenth; null for a zero denominator. */
function fraction(num: number, den: number): number | null {
  if (den === 0) return null
  return Math.round((num * 16) / den)
}

export function formatLength(v: Sixteenths): string {
  const total = Math.round(v)
  const sign = total < 0 ? '-' : ''
  const abs = Math.abs(total)
  const whole = Math.floor(abs / 16)
  let num = abs % 16
  if (num === 0) return `${sign}${whole}"`
  let den = 16
  while (num % 2 === 0) {
    num /= 2
    den /= 2
  }
  return whole === 0 ? `${sign}${num}/${den}"` : `${sign}${whole} ${num}/${den}"`
}
