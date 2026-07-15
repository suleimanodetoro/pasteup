import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import type { Clipping } from '../types'
import { rasterizeClip, rasterizeRect, type Point } from '../lib/trim'

const MAX_W = 760
const MAX_H = 540

export function TrimModal() {
  const trimTargetId = useStore((s) => s.trimTargetId)
  const clip = useStore((s) =>
    s.activePage()?.clippings.find((c) => c.id === s.trimTargetId),
  )
  const setTrimTarget = useStore((s) => s.setTrimTarget)

  if (!trimTargetId || !clip) return null
  return <TrimEditor key={clip.id + clip.src.length} clip={clip} onClose={() => setTrimTarget(null)} />
}

function TrimEditor({ clip, onClose }: { clip: Clipping; onClose: () => void }) {
  const applyTrim = useStore((s) => s.applyTrim)
  const pushToast = useStore((s) => s.pushToast)

  const imgRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const rectRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const drawingRef = useRef(false)

  const [mode, setMode] = useState<'free' | 'rect'>('free')
  const [torn, setTorn] = useState(false)
  const [display, setDisplay] = useState({ w: 0, h: 0, scale: 1 })
  const [hasPath, setHasPath] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // reset path when switching modes
  useEffect(() => {
    pointsRef.current = []
    rectRef.current = null
    setHasPath(false)
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function handleLoad() {
    const img = imgRef.current
    if (!img) return
    const natW = img.naturalWidth || 400
    const natH = img.naturalHeight || 400
    const scale = Math.min(MAX_W / natW, MAX_H / natH, 1)
    const w = Math.round(natW * scale)
    const h = Math.round(natH * scale)
    setDisplay({ w, h, scale })
    const c = overlayRef.current
    if (c) {
      c.width = w
      c.height = h
    }
  }

  function pos(e: React.PointerEvent) {
    const c = overlayRef.current!
    const r = c.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(c.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(c.height, e.clientY - r.top)),
    }
  }

  function redraw() {
    const c = overlayRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)

    let path: Point[] = []
    if (mode === 'free') {
      path = pointsRef.current
    } else if (rectRef.current) {
      const { x0, y0, x1, y1 } = rectRef.current
      path = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ]
    }
    if (path.length < 2) return

    // Dim everything outside the kept region.
    ctx.save()
    ctx.fillStyle = 'rgba(18, 12, 6, 0.5)'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Dashed cut line.
    ctx.save()
    ctx.setLineDash([7, 5])
    ctx.lineWidth = 2
    ctx.strokeStyle = '#fff5e8'
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
    if (!drawingRef.current || mode === 'rect') ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  function onDown(e: React.PointerEvent) {
    e.preventDefault()
    overlayRef.current?.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = pos(e)
    if (mode === 'free') {
      pointsRef.current = [p]
    } else {
      rectRef.current = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }
    }
    setHasPath(false)
    redraw()
  }

  function onMove(e: React.PointerEvent) {
    if (!drawingRef.current) return
    const p = pos(e)
    if (mode === 'free') {
      const pts = pointsRef.current
      const last = pts[pts.length - 1]
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2.5) pts.push(p)
    } else if (rectRef.current) {
      rectRef.current.x1 = p.x
      rectRef.current.y1 = p.y
    }
    redraw()
  }

  function onUp() {
    drawingRef.current = false
    const ok =
      mode === 'free'
        ? pointsRef.current.length >= 3
        : !!rectRef.current &&
          Math.abs(rectRef.current.x1 - rectRef.current.x0) > 6 &&
          Math.abs(rectRef.current.y1 - rectRef.current.y0) > 6
    setHasPath(ok)
    redraw()
  }

  function clearPath() {
    pointsRef.current = []
    rectRef.current = null
    setHasPath(false)
    redraw()
  }

  function apply() {
    const img = imgRef.current
    if (!img || !hasPath) return
    const s = display.scale
    try {
      let result
      if (mode === 'free') {
        const natural = pointsRef.current.map((p) => ({ x: p.x / s, y: p.y / s }))
        result = rasterizeClip(img, natural, torn)
      } else {
        const r = rectRef.current!
        const x = Math.min(r.x0, r.x1) / s
        const y = Math.min(r.y0, r.y1) / s
        const w = Math.abs(r.x1 - r.x0) / s
        const h = Math.abs(r.y1 - r.y0) / s
        result = rasterizeRect(img, { x, y, w, h })
      }
      applyTrim(clip.id, result, img.naturalWidth, img.naturalHeight)
    } catch {
      pushToast('Trim failed on this image.', 'error')
      onClose()
    }
  }

  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>✂ Snip a clipping</h3>
          <div className="seg" role="tablist">
            <button className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}>
              Freehand
            </button>
            <button className={mode === 'rect' ? 'active' : ''} onClick={() => setMode('rect')}>
              Rectangle
            </button>
          </div>
          {mode === 'free' && (
            <label className="trim-toggle">
              <input type="checkbox" checked={torn} onChange={(e) => setTorn(e.target.checked)} />
              torn edge
            </label>
          )}
          <div className="spacer" />
          <span className="muted">
            {mode === 'free' ? 'Drag to draw a cut path' : 'Drag a rectangle'} · Esc to cancel
          </span>
        </div>

        <div className="modal-body">
          <div
            className="trim-canvas-host"
            style={{ width: display.w || 'auto', height: display.h || 'auto' }}
          >
            <img
              ref={imgRef}
              src={clip.src}
              onLoad={handleLoad}
              draggable={false}
              style={{ width: display.w || 'auto', height: display.h || 'auto', display: 'block' }}
              alt=""
            />
            <canvas
              ref={overlayRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              style={{
                position: 'absolute',
                inset: 0,
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={clearPath} disabled={!hasPath}>
            Clear
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={apply} disabled={!hasPath}>
            ✂ Snip it
          </button>
        </div>
      </div>
    </div>
  )
}
