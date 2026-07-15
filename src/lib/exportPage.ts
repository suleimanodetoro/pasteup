import type { Page } from '../types'
import { getPageColor } from './presets'
import { loadHtmlImage } from './image'

export class ExportError extends Error {}

/**
 * Render a page to a PNG dataURL by re-drawing every clipping onto a plain 2D
 * canvas. This mirrors the Konva scene exactly (Konva rotates around a node's
 * top-left origin, which is what we replicate here) while sidestepping the
 * coordinate gymnastics of exporting a zoomed/panned stage.
 */
export async function exportPageToDataURL(page: Page, scale = 2): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(page.width * scale)
  canvas.height = Math.round(page.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)

  ctx.fillStyle = getPageColor(page.color)
  ctx.fillRect(0, 0, page.width, page.height)

  for (const c of page.clippings) {
    let img: HTMLImageElement
    try {
      img = await loadHtmlImage(c.src)
    } catch {
      continue // skip an image that won't load rather than aborting the whole export
    }
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate((c.rotation * Math.PI) / 180)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    ctx.restore()
  }

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
