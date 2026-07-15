import { useState } from 'react'
import { useStore } from '../store/useStore'
import { exportPageToDataURL, downloadDataURL } from '../lib/exportPage'
import { SubmitDialog } from './SubmitDialog'

export function Topbar() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const page = useStore((s) => s.activePage())
  const pushToast = useStore((s) => s.pushToast)

  const [submitOpen, setSubmitOpen] = useState(false)

  async function download() {
    if (!page) return
    try {
      const dataURL = await exportPageToDataURL(page, 2)
      const name = (page.name || 'pasteup').replace(/\s+/g, '-').toLowerCase()
      downloadDataURL(dataURL, `${name}.png`)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          Pasteup&nbsp;✂ <span className="tag">cutting mat</span>
        </div>
        <div className="spacer" />

        {view === 'studio' && (
          <>
            <button className="btn icon" onClick={() => undo()} disabled={!canUndo} title="Undo (⌘/Ctrl+Z)">
              ↶
            </button>
            <button
              className="btn icon"
              onClick={() => redo()}
              disabled={!canRedo}
              title="Redo (⌘/Ctrl+Shift+Z)"
            >
              ↷
            </button>
            <button className="btn" onClick={() => void download()} title="Download PNG (2×)">
              ⬇ Download
            </button>
            <button className="btn primary" onClick={() => setSubmitOpen(true)}>
              Submit to gallery
            </button>
          </>
        )}

        <div className="seg">
          <button className={view === 'studio' ? 'active' : ''} onClick={() => setView('studio')}>
            Studio
          </button>
          <button className={view === 'gallery' ? 'active' : ''} onClick={() => setView('gallery')}>
            Gallery
          </button>
        </div>
      </header>
      {submitOpen && <SubmitDialog onClose={() => setSubmitOpen(false)} />}
    </>
  )
}
