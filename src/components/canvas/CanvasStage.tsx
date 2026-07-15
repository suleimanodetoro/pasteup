import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useStore } from '../../store/useStore'
import { getPageColor } from '../../lib/presets'
import { fileToDataURL, extractImageFromDataTransfer } from '../../lib/image'
import { ClippingImage } from './ClippingImage'
import { SelectionToolbar } from './SelectionToolbar'

export function CanvasStage() {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const [size, setSize] = useState({ w: 1, h: 1 })
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [dropHot, setDropHot] = useState(false)
  const didFit = useRef(false)

  const hydrated = useStore((s) => s.hydrated)
  const page = useStore((s) => s.activePage())
  const selectedId = useStore((s) => s.selectedId)
  const stage = useStore((s) => s.stage)
  const select = useStore((s) => s.select)
  const updateClipping = useStore((s) => s.updateClipping)
  const setStage = useStore((s) => s.setStage)
  const setViewport = useStore((s) => s.setViewport)
  const zoomAt = useStore((s) => s.zoomAt)
  const fitToScreen = useStore((s) => s.fitToScreen)
  const addImage = useStore((s) => s.addImage)
  const pushToast = useStore((s) => s.pushToast)

  // Measure host + keep the store's viewport in sync.
  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      setSize({ w, h })
      setViewport(w, h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [setViewport])

  // Fit the page into view once, on first load.
  useEffect(() => {
    if (!didFit.current && hydrated && page && size.w > 2) {
      fitToScreen()
      didFit.current = true
    }
  }, [hydrated, page, size.w, fitToScreen])

  // Space-to-pan.
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement
      return el instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(el.tagName)
    }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Attach the transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current
    const st = stageRef.current
    if (!tr || !st) return
    const node = selectedId ? st.findOne('#' + selectedId) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, page])

  const clippings = page?.clippings ?? []

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const evt = e.evt
    if (evt.ctrlKey || evt.metaKey) {
      const pointer = stageRef.current?.getPointerPosition()
      const factor = evt.deltaY > 0 ? 0.92 : 1.08
      zoomAt(stage.scale * factor, pointer ?? undefined)
    } else {
      setStage({ x: stage.x - evt.deltaX, y: stage.y - evt.deltaY })
    }
  }

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) select(null)
  }

  const selectedClip = clippings.find((c) => c.id === selectedId)

  // Screen-space (host-relative) position for the floating selection toolbar.
  const selPos = useMemo(() => {
    if (!selectedClip || interacting || spaceDown) return null
    const { x, y, width, height, rotation } = selectedClip
    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const corners = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ].map(([px, py]) => {
      const sceneX = x + px * cos - py * sin
      const sceneY = y + px * sin + py * cos
      return {
        hx: sceneX * stage.scale + stage.x,
        hy: sceneY * stage.scale + stage.y,
      }
    })
    const xs = corners.map((c) => c.hx)
    const ys = corners.map((c) => c.hy)
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2
    const topY = Math.min(...ys)
    return {
      x: Math.max(96, Math.min(size.w - 96, midX)),
      y: Math.max(46, topY),
    }
  }, [selectedClip, interacting, spaceDown, stage, size.w])

  return (
    <div
      className="stage-wrap"
      onDragOver={(e) => {
        e.preventDefault()
        setDropHot(true)
      }}
      onDragLeave={() => setDropHot(false)}
      onDrop={async (e) => {
        e.preventDefault()
        setDropHot(false)
        const file = extractImageFromDataTransfer(e.dataTransfer)
        if (!file) return
        try {
          const dataURL = await fileToDataURL(file)
          const rect = hostRef.current?.getBoundingClientRect()
          const at = rect
            ? {
                x: (e.clientX - rect.left - stage.x) / stage.scale,
                y: (e.clientY - rect.top - stage.y) / stage.scale,
              }
            : undefined
          await addImage(dataURL, { at })
        } catch {
          pushToast('Could not read that dropped image.', 'error')
        }
      }}
    >
      <div className="ruler top" />
      <div className="ruler left" />
      <div className="ruler corner" />
      {dropHot && <div className="dropzone hot drop-overlay" />}

      <div
        ref={hostRef}
        className={`stage-host${spaceDown ? ' panning' : ''}${panning ? ' active' : ''}`}
      >
        {page && (
          <Stage
            ref={stageRef}
            width={size.w}
            height={size.h}
            scaleX={stage.scale}
            scaleY={stage.scale}
            x={stage.x}
            y={stage.y}
            draggable={spaceDown}
            onWheel={onWheel}
            onMouseDown={onStageMouseDown}
            onTouchStart={onStageMouseDown}
            onDragStart={() => setPanning(true)}
            onDragEnd={(e) => {
              setPanning(false)
              if (e.target === e.target.getStage()) {
                setStage({ x: e.target.x(), y: e.target.y() })
              }
            }}
          >
            <Layer>
              {/* Paper page with drop shadow */}
              <Rect
                x={0}
                y={0}
                width={page.width}
                height={page.height}
                fill={getPageColor(page.color)}
                cornerRadius={2}
                shadowColor="#000000"
                shadowBlur={24}
                shadowOffset={{ x: 0, y: 10 }}
                shadowOpacity={0.28}
                listening={false}
              />
              {clippings.map((clip) => (
                <ClippingImage
                  key={clip.id}
                  clip={clip}
                  isSelected={clip.id === selectedId}
                  listening={!spaceDown}
                  onSelect={() => select(clip.id)}
                  onChange={(patch) => updateClipping(clip.id, patch)}
                  onInteractStart={() => setInteracting(true)}
                  onInteractEnd={() => setInteracting(false)}
                />
              ))}
              <Transformer
                ref={trRef}
                rotateEnabled
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={6}
                anchorSize={10}
                anchorCornerRadius={5}
                anchorStroke="#c66a4a"
                anchorFill="#fff8ec"
                borderStroke="#c66a4a"
                borderDash={[4, 4]}
                padding={3}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 16 || newBox.height < 16 ? oldBox : newBox
                }
              />
            </Layer>
          </Stage>
        )}

        {selPos && selectedClip && <SelectionToolbar x={selPos.x} y={selPos.y} clip={selectedClip} />}
      </div>
    </div>
  )
}
