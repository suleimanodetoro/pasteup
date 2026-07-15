// Trim / snip rasterization.
//
// We take the original image + a cut path (in the image's *natural* pixel
// coordinates) and produce a new dataURL clipped to that path, tightly cropped
// to the path's bounding box. Callers use the returned natural-space crop rect
// to keep the clipping visually anchored where it was on the page.

export interface Point {
  x: number
  y: number
}

export interface TrimResult {
  src: string
  natCropX: number
  natCropY: number
  natCropW: number
  natCropH: number
}

function bbox(points: Point[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

/** Resample a closed polygon and jitter vertices perpendicular to each edge for a ripped-paper look. */
function tornify(points: Point[], amp = 5, seg = 7): Point[] {
  if (points.length < 3) return points
  const out: Point[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy) || 1
    const n = Math.max(1, Math.floor(dist / seg))
    const nx = -dy / dist
    const ny = dx / dist
    for (let j = 0; j < n; j++) {
      const t = j / n
      const off = (Math.random() * 2 - 1) * amp
      out.push({ x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off })
    }
  }
  return out
}

export function rasterizeClip(
  img: HTMLImageElement,
  naturalPoints: Point[],
  torn = false,
): TrimResult {
  const pts = torn ? tornify(naturalPoints) : naturalPoints
  const bb = bbox(pts)
  const pad = 2
  const cropX = Math.max(0, Math.floor(bb.minX - pad))
  const cropY = Math.max(0, Math.floor(bb.minY - pad))
  const cropW = Math.min(
    img.naturalWidth - cropX,
    Math.ceil(bb.maxX - bb.minX + pad * 2),
  )
  const cropH = Math.min(
    img.naturalHeight - cropY,
    Math.ceil(bb.maxY - bb.minY + pad * 2),
  )

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, cropW)
  canvas.height = Math.max(1, cropH)
  const ctx = canvas.getContext('2d')!

  ctx.beginPath()
  ctx.moveTo(pts[0].x - cropX, pts[0].y - cropY)
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x - cropX, pts[i].y - cropY)
  }
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(img, -cropX, -cropY)

  return {
    src: canvas.toDataURL('image/png'),
    natCropX: cropX,
    natCropY: cropY,
    natCropW: cropW,
    natCropH: cropH,
  }
}

/** Rectangular crop convenience — expressed as a 4-point path. */
export function rasterizeRect(
  img: HTMLImageElement,
  rect: { x: number; y: number; w: number; h: number },
): TrimResult {
  const pts: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ]
  return rasterizeClip(img, pts, false)
}
