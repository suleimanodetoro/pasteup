import type { ImageSource, SearchResponse, SearchResult } from '../types'

const API = 'https://api.openverse.org/v1/images/'
const PAGE_SIZE = 24

interface OpenverseItem {
  id: string
  title?: string
  url?: string
  thumbnail?: string
  creator?: string
  license?: string
  license_version?: string
  license_url?: string
  foreign_landing_url?: string
  width?: number
  height?: number
}

interface OpenverseResponse {
  result_count: number
  page_count: number
  page: number
  results: OpenverseItem[]
}

function toResult(item: OpenverseItem): SearchResult | null {
  const full = item.url
  if (!full) return null
  const licenseName = item.license
    ? `CC ${item.license.toUpperCase()}${item.license_version ? ' ' + item.license_version : ''}`
    : undefined
  return {
    id: item.id,
    thumb: item.thumbnail || full,
    full,
    title: item.title,
    width: item.width,
    height: item.height,
    attribution: {
      source: 'Openverse',
      author: item.creator,
      license: licenseName,
      licenseUrl: item.license_url,
      sourceUrl: item.foreign_landing_url,
    },
  }
}

async function query(q: string, page: number): Promise<OpenverseResponse> {
  const url = new URL(API)
  url.searchParams.set('q', q)
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(PAGE_SIZE))
  // Anonymous, low-rate, CORS-friendly access. No API key required.
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Openverse request failed')
  return (await res.json()) as OpenverseResponse
}

export const openverseSource: ImageSource = {
  id: 'openverse',
  label: 'Photos',
  note: 'Openly-licensed photos. Attribution & license are kept with each clipping.',

  async search(q: string, page = 0): Promise<SearchResponse> {
    // Openverse pages are 1-based.
    const data = await query(q, page + 1)
    const results = (data.results ?? [])
      .map(toResult)
      .filter((r): r is SearchResult => Boolean(r))
    return { results, hasMore: data.page < data.page_count }
  },

  async random(): Promise<SearchResponse> {
    const words = ['flowers', 'vintage', 'sky', 'texture', 'ocean', 'forest', 'city', 'paper']
    const pick = words[Math.floor(Math.random() * words.length)]
    return this.search(pick, Math.floor(Math.random() * 3))
  },
}
