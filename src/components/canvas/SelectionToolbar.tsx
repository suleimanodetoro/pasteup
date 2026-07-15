import { useStore } from '../../store/useStore'
import type { Clipping } from '../../types'

interface Props {
  x: number
  y: number
  clip: Clipping
}

export function SelectionToolbar({ x, y, clip }: Props) {
  const setTrimTarget = useStore((s) => s.setTrimTarget)
  const resetTrim = useStore((s) => s.resetTrim)
  const bringToFront = useStore((s) => s.bringToFront)
  const sendToBack = useStore((s) => s.sendToBack)
  const duplicate = useStore((s) => s.duplicateClipping)
  const del = useStore((s) => s.deleteClipping)

  const isTrimmed = clip.src !== clip.originalSrc

  return (
    <div className="sel-toolbar" style={{ left: x, top: y }}>
      <button onClick={() => setTrimTarget(clip.id)} title="Trim / snip (scissors)">
        ✂ <span>Trim</span>
      </button>
      {isTrimmed && (
        <button onClick={() => resetTrim(clip.id)} title="Reset trim">
          ↺
        </button>
      )}
      <span className="divider" />
      <button onClick={() => bringToFront(clip.id)} title="Bring to front">
        ⤴
      </button>
      <button onClick={() => sendToBack(clip.id)} title="Send to back">
        ⤵
      </button>
      <span className="divider" />
      <button onClick={() => duplicate(clip.id)} title="Duplicate">
        ⧉
      </button>
      <button className="danger" onClick={() => del(clip.id)} title="Delete">
        🗑
      </button>
    </div>
  )
}
