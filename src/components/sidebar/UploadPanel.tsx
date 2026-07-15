import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { fileToDataURL } from '../../lib/image'

export function UploadPanel() {
  const addImage = useStore((s) => s.addImage)
  const pushToast = useStore((s) => s.pushToast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [hot, setHot] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const dataURL = await fileToDataURL(file)
        await addImage(dataURL)
      } catch {
        pushToast(`Could not read ${file.name}.`, 'error')
      }
    }
  }

  return (
    <div>
      <div
        className={`dropzone${hot ? ' hot' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setHot(true)
        }}
        onDragLeave={() => setHot(false)}
        onDrop={(e) => {
          e.preventDefault()
          setHot(false)
          void handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="big">Upload your own ✦</div>
        <div className="muted">Click to browse — or drop images right onto the mat.</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <p className="help">
        You can also paste an image straight from your clipboard with{' '}
        <b>⌘/Ctrl&nbsp;+&nbsp;V</b>.
      </p>
    </div>
  )
}
