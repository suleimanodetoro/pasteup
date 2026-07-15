import type { PageColor, PageColorId, PagePreset } from '../types'

// Page sizes at ~96px/inch so proportions read true to print.
export const PAGE_PRESETS: PagePreset[] = [
  { id: 'letter-portrait', label: 'Letter · portrait', width: 816, height: 1056 },
  { id: 'letter-landscape', label: 'Letter · landscape', width: 1056, height: 816 },
  { id: 'a4-portrait', label: 'A4 · portrait', width: 794, height: 1123 },
  { id: 'a4-landscape', label: 'A4 · landscape', width: 1123, height: 794 },
  { id: 'square', label: 'Square', width: 900, height: 900 },
  { id: 'postcard', label: 'Postcard', width: 840, height: 576 },
  { id: 'tabloid', label: 'Tabloid', width: 1056, height: 1632 },
]

export const DEFAULT_PRESET_ID = 'letter-portrait'

export function getPreset(id: string): PagePreset {
  return PAGE_PRESETS.find((p) => p.id === id) ?? PAGE_PRESETS[0]
}

export const PAGE_COLORS: PageColor[] = [
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'cream', label: 'Cream', value: '#f6ecd6' },
  { id: 'kraft', label: 'Kraft tan', value: '#d8b98c' },
  { id: 'pink', label: 'Pink', value: '#f6d3d9' },
  { id: 'mint', label: 'Mint', value: '#d3ece0' },
  { id: 'yellow', label: 'Pale yellow', value: '#f7f0c8' },
  { id: 'blue', label: 'Pale blue', value: '#d5e6f2' },
  { id: 'black', label: 'Black', value: '#1e1e1e' },
]

export function getPageColor(id: PageColorId): string {
  return PAGE_COLORS.find((c) => c.id === id)?.value ?? '#ffffff'
}
