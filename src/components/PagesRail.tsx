import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { getPageColor } from '../lib/presets'
import { loadHtmlImage } from '../lib/image'
import type { Page } from '../types'

function PageThumb({
  page,
  index,
  active,
  onClick,
  onDelete,
}: {
  page: Page
  index: number
  active: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
    const targetW = 108
    const dpr = 2
    const s = targetW / page.width
    canvas.width = Math.round(page.width * s * dpr)
    canvas.height = Math.round(page.height * s * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.scale(s * dpr, s * dpr)
    ctx.fillStyle = getPageColor(page.color)
    ctx.fillRect(0, 0, page.width, page.height)
    ;(async () => {
      for (const clip of page.clippings) {
        if (cancelled) return
        try {
          const img = await loadHtmlImage(clip.src)
          if (cancelled) return
          ctx.save()
          ctx.translate(clip.x, clip.y)
          ctx.rotate((clip.rotation * Math.PI) / 180)
          ctx.drawImage(img, 0, 0, clip.width, clip.height)
          ctx.restore()
        } catch {
          /* skip */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div className={`page-thumb${active ? ' active' : ''}`} onClick={onClick}>
      <canvas ref={ref} className="thumb-canvas" />
      <div className="lbl">
        <span>Page {index + 1}</span>
        <button
          className="del"
          title="Delete page"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function PagesRail() {
  const pages = useStore((s) => s.pages)
  const activePageId = useStore((s) => s.activePageId)
  const switchPage = useStore((s) => s.switchPage)
  const deletePage = useStore((s) => s.deletePage)
  const addPage = useStore((s) => s.addPage)

  return (
    <div className="pages-rail">
      <div className="rail-head">Pages</div>
      <div className="pages-list">
        {pages.map((p, i) => (
          <PageThumb
            key={p.id}
            page={p}
            index={i}
            active={p.id === activePageId}
            onClick={() => switchPage(p.id)}
            onDelete={() => deletePage(p.id)}
          />
        ))}
        <button className="add-page" onClick={() => addPage()}>
          + Add page
        </button>
      </div>
    </div>
  )
}
