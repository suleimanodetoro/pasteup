import type { ImageSource, SearchResponse, SearchResult } from '../types'

const API = 'https://commons.wikimedia.org/w/api.php'
const PAGE_SIZE = 24
const THUMB_WIDTH = 400

// Only bring back raster images we can actually draw/export.
const BITMAP_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface CommonsPage {
  title?: string
  imageinfo?: Array<{
    url?: string
    thumburl?: string
    thumbwidth?: number
    thumbheight?: number
    width?: number
    height?: number
    mime?: string
    extmetadata?: {
      Artist?: { value?: string }
      LicenseShortName?: { value?: string }
      LicenseUrl?: { value?: string }
      DescriptionUrl?: { value?: string }
    }
  }>
  fullurl?: string
}

function stripHtml(html?: string): string | undefined {
  if (!html) return undefined
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim() || undefined
}

function toResult(page: CommonsPage): SearchResult | null {
  const info = page.imageinfo?.[0]
  if (!info?.thumburl || !info.url) return null
  if (info.mime && !BITMAP_MIMES.includes(info.mime)) return null
  const meta = info.extmetadata
  return {
    id: page.title ?? info.url,
    thumb: info.thumburl,
    full: info.url,
    title: page.title?.replace(/^File:/, ''),
    width: info.width,
    height: info.height,
    attribution: {
      source: 'Wikimedia Commons',
      author: stripHtml(meta?.Artist?.value),
      license: stripHtml(meta?.LicenseShortName?.value),
      licenseUrl: meta?.LicenseUrl?.value,
      sourceUrl: meta?.DescriptionUrl?.value ?? page.fullurl,
    },
  }
}

async function callApi(params: Record<string, string>): Promise<CommonsPage[]> {
  const url = new URL(API)
  const search = {
    format: 'json',
    origin: '*', // CORS
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: String(THUMB_WIDTH),
    ...params,
  }
  Object.entries(search).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Wikimedia request failed')
  const json = await res.json()
  const pages = json?.query?.pages
  if (!pages) return []
  return Object.values(pages) as CommonsPage[]
}

export const wikimediaSource: ImageSource = {
  id: 'wikimedia',
  label: 'Art',
  note: 'Public art & illustration from Wikimedia Commons.',

  async search(query: string, page = 0): Promise<SearchResponse> {
    const pages = await callApi({
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6', // File:
      gsrlimit: String(PAGE_SIZE),
      gsroffset: String(page * PAGE_SIZE),
    })
    const results = pages.map(toResult).filter((r): r is SearchResult => Boolean(r))
    return { results, hasMore: results.length >= PAGE_SIZE }
  },

  async random(): Promise<SearchResponse> {
    const pages = await callApi({
      generator: 'random',
      grnnamespace: '6',
      grnlimit: '12',
    })
    const results = pages.map(toResult).filter((r): r is SearchResult => Boolean(r))
    return { results, hasMore: false }
  },
}
