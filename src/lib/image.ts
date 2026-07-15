// Image loading helpers with CORS-taint handling.
//
// Everything we place on the canvas is normalised to a dataURL so that:
//   1. the canvas never becomes "tainted" (which would break export + trim), and
//   2. work survives a refresh once persisted to IndexedDB.

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'))
    reader.readAsDataURL(blob)
  })
}

export function fileToDataURL(file: File): Promise<string> {
  return blobToDataURL(file)
}

/** Load an HTMLImageElement from a (safe) src such as a dataURL. */
export function loadHtmlImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = src
  })
}

export class ImageLoadError extends Error {}

/**
 * Resolve a remote URL to a dataURL.
 *
 * Strategy, in order:
 *   1. fetch → blob → dataURL (works whenever the host sends CORS headers,
 *      e.g. Wikimedia Commons + Openverse thumbnails).
 *   2. crossOrigin="anonymous" <img> → canvas → dataURL (some CDNs allow this
 *      even when fetch is blocked).
 * If both fail we throw so the caller can tell the user to download + upload.
 */
export async function loadRemoteImageAsDataURL(url: string): Promise<string> {
  // 1. fetch → blob
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (res.ok) {
      const blob = await res.blob()
      if (blob.type.startsWith('image/')) {
        return await blobToDataURL(blob)
      }
    }
  } catch {
    /* fall through to the <img> approach */
  }

  // 2. crossOrigin <img> → canvas
  try {
    const img = await loadHtmlImage(url, 'anonymous')
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    throw new ImageLoadError(
      "This image host won't allow direct loading (CORS). Download the image and upload it instead.",
    )
  }
}

export interface LoadedImage {
  src: string
  width: number
  height: number
}

/** Turn a dataURL into a {src,width,height} record for placement on a page. */
export async function measureImage(src: string): Promise<LoadedImage> {
  const img = await loadHtmlImage(src)
  return { src, width: img.naturalWidth || 400, height: img.naturalHeight || 400 }
}

/** Read an image out of a paste/drag DataTransfer, if present. */
export function extractImageFromDataTransfer(dt: DataTransfer): File | null {
  for (const item of Array.from(dt.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }
  for (const file of Array.from(dt.files)) {
    if (file.type.startsWith('image/')) return file
  }
  return null
}
