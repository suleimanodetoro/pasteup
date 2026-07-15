import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PAGE_PRESETS, PAGE_COLORS, getPageColor } from '../lib/presets'

export function BottomToolbar() {
  const page = useStore((s) => s.activePage())
  const setPreset = useStore((s) => s.setPreset)
  const setPageColor = useStore((s) => s.setPageColor)
  const scale = useStore((s) => s.stage.scale)
  const zoomBy = useStore((s) => s.zoomBy)
  const fitToScreen = useStore((s) => s.fitToScreen)

  const [open, setOpen] = useState<'size' | 'color' | null>(null)

  if (!page) return null

  const preset = PAGE_PRESETS.find((p) => p.id === page.presetId) ?? PAGE_PRESETS[0]
  const color = PAGE_COLORS.find((c) => c.id === page.color)

  return (
    <>
      {open && <div className="popover-backdrop" onMouseDown={() => setOpen(null)} />}
      <div className="bottom-bar">
        <div className="pos-anchor">
          <button
            className="chip"
            onClick={() => setOpen(open === 'size' ? null : 'size')}
            title="Page size"
          >
            📐 {preset.label}
          </button>
          {open === 'size' && (
            <div className="popover">
              <h4>Page size</h4>
              <div className="preset-list">
                {PAGE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={p.id === page.presetId ? 'active' : ''}
                    onClick={() => {
                      setPreset(p.id)
                      fitToScreen()
                      setOpen(null)
                    }}
                  >
                    <span>{p.label}</span>
                    <span className="dim">
                      {p.width}×{p.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pos-anchor">
          <button
            className="chip"
            onClick={() => setOpen(open === 'color' ? null : 'color')}
            title="Page color"
          >
            <span className="swatch-dot" style={{ background: getPageColor(page.color) }} />
            {color?.label ?? 'Color'}
          </button>
          {open === 'color' && (
            <div className="popover">
              <h4>Page color</h4>
              <div className="swatches">
                {PAGE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    className={`swatch${c.id === page.color ? ' active' : ''}`}
                    style={{ background: c.value }}
                    title={c.label}
                    onClick={() => {
                      setPageColor(c.id)
                      setOpen(null)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="zoom">
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out">
            −
          </button>
          <span className="pct">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomBy(1.2)} title="Zoom in">
            +
          </button>
          <button onClick={() => fitToScreen()} title="Fit to screen" style={{ fontSize: 12 }}>
            fit
          </button>
        </div>
      </div>
    </>
  )
}
