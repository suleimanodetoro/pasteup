import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { exportPageToDataURL } from '../lib/exportPage'

export function SubmitDialog({ onClose }: { onClose: () => void }) {
  const page = useStore((s) => s.activePage())
  const submit = useStore((s) => s.submitToGallery)
  const setView = useStore((s) => s.setView)
  const pushToast = useStore((s) => s.pushToast)

  const [title, setTitle] = useState('')
  const [dedication, setDedication] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!page) return
    let cancelled = false
    exportPageToDataURL(page, 1)
      .then((d) => !cancelled && setPreview(d))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [page])

  async function go() {
    if (!page) return
    setBusy(true)
    try {
      const image = await exportPageToDataURL(page, 2)
      await submit({
        title: title.trim() || 'Untitled collage',
        dedication: dedication.trim() || undefined,
        image,
      })
      pushToast('Pasted up into your gallery ✦')
      onClose()
      setView('gallery')
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not export the page.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 440 }}>
        <div className="modal-head">
          <h3>Submit to gallery</h3>
          <div className="spacer" />
        </div>
        <div style={{ padding: 16 }}>
          {preview && (
            <img
              src={preview}
              alt="preview"
              style={{
                width: '100%',
                borderRadius: 6,
                marginBottom: 14,
                boxShadow: 'var(--shadow-md)',
              }}
            />
          )}
          <div className="form-row">
            <label>Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A little collage"
            />
          </div>
          <div className="form-row">
            <label>Dedication (optional)</label>
            <input
              className="input"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              placeholder="for Amara ❤"
            />
          </div>
          <p className="help">
            Saved on <b>this device</b> only, for now. A shared, public gallery is on the roadmap.
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => void go()} disabled={busy}>
            {busy ? 'Saving…' : 'Add to gallery'}
          </button>
        </div>
      </div>
    </div>
  )
}
