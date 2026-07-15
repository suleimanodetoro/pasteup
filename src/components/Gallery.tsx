import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { GalleryEntry } from '../types'

const TILTS = [-2.2, 1.6, -1, 2, -1.6, 1.1, -0.7]

export function Gallery() {
  const entries = useStore((s) => s.gallery)
  const setView = useStore((s) => s.setView)
  const remove = useStore((s) => s.removeGalleryEntry)
  const [open, setOpen] = useState<GalleryEntry | null>(null)

  return (
    <div className="gallery">
      <div className="gallery-inner">
        <h1>The Gallery</h1>
        <p className="sub">
          Collages you've pasted up, kept right here on this device. A shared, public gallery is on
          the roadmap.
        </p>

        <div className="gallery-grid">
          <button className="gcard-add" onClick={() => setView('studio')}>
            <span className="plus">+</span>
            add yours
          </button>

          {entries.map((e, i) => (
            <div
              key={e.id}
              className="gcard"
              style={{ ['--tilt' as string]: `${TILTS[i % TILTS.length]}deg` }}
              onClick={() => setOpen(e)}
            >
              <img src={e.image} alt={e.title} />
              <div className="meta">
                <div className="t">{e.title}</div>
                {e.dedication && <div className="d">{e.dedication}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="lightbox" onMouseDown={() => setOpen(null)}>
          <div className="frame" onMouseDown={(e) => e.stopPropagation()}>
            <img src={open.image} alt={open.title} />
            <div className="cap">
              <div className="t">{open.title}</div>
              {open.dedication && <div className="d">{open.dedication}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => {
                  void remove(open.id)
                  setOpen(null)
                }}
              >
                🗑 Delete
              </button>
              <button className="btn" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
