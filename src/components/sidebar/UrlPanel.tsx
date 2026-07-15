import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { loadRemoteImageAsDataURL } from '../../lib/image'

export function UrlPanel() {
  const addImage = useStore((s) => s.addImage)
  const pushToast = useStore((s) => s.pushToast)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    const u = url.trim()
    if (!u) return
    setBusy(true)
    try {
      const dataURL = await loadRemoteImageAsDataURL(u)
      await addImage(dataURL, { attribution: { source: 'Imported URL', sourceUrl: u } })
      setUrl('')
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not import that URL.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="field">
        <input
          className="input"
          placeholder="https://…/image.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add()}
        />
        <button className="btn primary" onClick={() => void add()} disabled={busy || !url.trim()}>
          {busy ? '…' : 'Add'}
        </button>
      </div>
      <p className="help">
        Paste a <b>direct</b> image link (one that ends in .jpg, .png, .webp…).
        <br />
        <br />
        Instagram, Pinterest and Google Images don't offer direct API access, so the way in is to
        <b> save the image and Upload it</b>, or copy its direct image URL. If a host blocks loading
        (a CORS error), download the picture and use the Upload tab instead.
      </p>
    </div>
  )
}
