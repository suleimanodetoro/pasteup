import type { Attribution, Page } from '../types'

/** Short, human-friendly credit: "author · license", falling back to source. */
export function creditLabel(a: Attribution): string {
  return [a.author, a.license].filter(Boolean).join(' · ') || a.source
}

/** Best link for a credit — the item's landing page, else the license page. */
export function creditHref(a: Attribution): string | undefined {
  return a.sourceUrl || a.licenseUrl
}

/** Full plain-text credit for copy-to-clipboard. */
export function creditText(a: Attribution): string {
  const bits = [a.author, a.license, a.source].filter(Boolean)
  const line = bits.join(' · ')
  const href = creditHref(a)
  return href ? `${line} — ${href}` : line
}

/**
 * Distinct attributions used by real (non how-to) clippings on a page,
 * de-duplicated by their copy text. Handy for a "credits" summary.
 */
export function pageAttributions(page: Page): Attribution[] {
  const seen = new Set<string>()
  const out: Attribution[] = []
  for (const c of page.clippings) {
    if (c.isHowTo || !c.attribution) continue
    const key = creditText(c.attribution)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c.attribution)
  }
  return out
}
