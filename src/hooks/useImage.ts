import { useEffect, useState } from 'react'

/**
 * Load an HTMLImageElement from a safe src (dataURL / objectURL) for use as a
 * Konva image. No crossOrigin needed — everything we place is already a dataURL.
 */
export function useImage(src: string | undefined): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>()

  useEffect(() => {
    if (!src) {
      setImage(undefined)
      return
    }
    let active = true
    const img = new window.Image()
    img.onload = () => {
      if (active) setImage(img)
    }
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  return image
}
