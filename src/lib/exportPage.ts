import type { Page } from '../types'
import { getPageColor } from './presets'
import { loadHtmlImage } from './image'

export class ExportError extends Error {}

// Kept in sync with the studio scene (CanvasStage page Rect + ClippingImage).
const PAGE_CORNER_RADIUS = 2
const CLIP_SHADOW = { color: 'rgba(0, 0, 0, 0.32)', blur: 9, offsetX: 2, offsetY: 4 }

export interface ExportOptions {
  /** Called once with the count of clippings whose image couldn't be loaded. */
  onImagesSkipped?: (count: number) => void
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(rad, 0)
  ctx.arcTo(w, 0, w, h, rad)
  ctx.arcTo(w, h, 0, h, rad)
  ctx.arcTo(0, h, 0, 0, rad)
  ctx.arcTo(0, 0, w, 0, rad)
  ctx.closePath()
}

/**
 * Render a page to a PNG dataURL by re-drawing every clipping onto a plain 2D
 * canvas. This mirrors the Konva studio scene — the page's rounded corners and
 * each clipping's drop shadow are reproduced here, and Konva rotates around a
 * node's top-left origin, which is what we replicate — while sidestepping the
 * coordinate gymnastics of exporting a zoomed/panned stage. (The page's own
 * outer drop shadow is intentionally omitted: it falls outside the page bounds
 * and so never lands on the exported, page-sized canvas.)
 */
export async function exportPageToDataURL(
  page: Page,
  scale = 2,
  opts?: ExportOptions,
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(page.width * scale)
  canvas.height = Math.round(page.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  // Clip the whole scene to the page's rounded rectangle so exported corners
  // match the studio's page.
  roundRectPath(ctx, page.width, page.height, PAGE_CORNER_RADIUS)
  ctx.clip()

  ctx.fillStyle = getPageColor(page.color)
  ctx.fillRect(0, 0, page.width, page.height)

  let skipped = 0
  for (const c of page.clippings) {
    let img: HTMLImageElement
    try {
      img = await loadHtmlImage(c.src)
    } catch {
      skipped++ // skip an image that won't load rather than aborting the whole export
      continue
    }
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate((c.rotation * Math.PI) / 180)
    ctx.shadowColor = CLIP_SHADOW.color
    ctx.shadowBlur = CLIP_SHADOW.blur
    ctx.shadowOffsetX = CLIP_SHADOW.offsetX
    ctx.shadowOffsetY = CLIP_SHADOW.offsetY
    ctx.drawImage(img, 0, 0, c.width, c.height)
    ctx.restore()
  }

  if (skipped > 0) opts?.onImagesSkipped?.(skipped)

  try {
    return canvas.toDataURL('image/png')
  } catch {
    throw new ExportError(
      'Export failed because a remote image tainted the canvas. Try re-adding that image via Upload.',
    )
  }
}

/** Trigger a browser download for a dataURL. */
export function downloadDataURL(dataURL: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
