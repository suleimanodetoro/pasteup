// Shared domain types for Pasteup.

export interface Attribution {
  /** Human-friendly source name, e.g. "Wikimedia Commons" or "Openverse". */
  source: string
  author?: string
  license?: string
  licenseUrl?: string
  /** Link back to the item's landing page. */
  sourceUrl?: string
}

export interface Clipping {
  id: string
  /** Current (possibly trimmed) image data — always a dataURL or objectURL that is safe to draw. */
  src: string
  /** Original, un-trimmed image so trim can be reset. */
  originalSrc: string
  /** Top-left position on the page, in page coordinates. */
  x: number
  y: number
  /** Displayed size in page coordinates (scale is baked into these on transform end). */
  width: number
  height: number
  rotation: number
  attribution?: Attribution
  /**
   * Page geometry (x/y/width/height) captured just before the FIRST trim was
   * applied. `resetTrim` restores it so the un-trimmed image returns to its
   * true original box. Absent on clippings that were never trimmed (and on
   * projects saved before this field existed).
   */
  originalGeometry?: { x: number; y: number; width: number; height: number }
  /** True for the generated first-run how-to card. */
  isHowTo?: boolean
}

export type PageColorId =
  | 'white'
  | 'cream'
  | 'kraft'
  | 'pink'
  | 'mint'
  | 'yellow'
  | 'blue'
  | 'black'

export interface Page {
  id: string
  name: string
  presetId: string
  width: number
  height: number
  color: PageColorId
  clippings: Clipping[]
}

export interface Project {
  pages: Page[]
  activePageId: string
}

export interface GalleryEntry {
  id: string
  title: string
  dedication?: string
  /** Exported PNG dataURL. */
  image: string
  createdAt: number
}

export interface PagePreset {
  id: string
  label: string
  width: number
  height: number
}

export interface PageColor {
  id: PageColorId
  label: string
  value: string
}

// ---- Image sources (pluggable connectors) ----

export interface SearchResult {
  id: string
  /** Small preview URL used in the sidebar grid. */
  thumb: string
  /** Full-resolution URL added to the page. */
  full: string
  title?: string
  width?: number
  height?: number
  attribution?: Attribution
}

export interface SearchResponse {
  results: SearchResult[]
  hasMore: boolean
}

/**
 * A pluggable image source. Future connectors (Pinterest/Instagram OAuth apps)
 * implement this same shape and slot into the sidebar without further changes.
 */
export interface ImageSource {
  id: string
  label: string
  /** Short helper text shown under the search box. */
  note?: string
  search(query: string, page: number): Promise<SearchResponse>
  /** Optional "surprise me" feed (powers the dice button). */
  random?(): Promise<SearchResponse>
}
