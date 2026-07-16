import { useStore } from '../../store/useStore'
import type { Clipping } from '../../types'
import { creditLabel, creditHref, creditText } from '../../lib/attribution'

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
  const pushToast = useStore((s) => s.pushToast)

  const isTrimmed = clip.src !== clip.originalSrc
  const attr = clip.attribution
  const href = attr && creditHref(attr)

  function copyCredit() {
    if (!attr) return
    const text = creditText(attr)
    const done = () => pushToast('Credit copied to clipboard.')
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () =>
        pushToast('Could not copy the credit.', 'error'),
      )
    } else {
      pushToast('Clipboard is unavailable in this browser.', 'error')
    }
  }

  return (
    <div className="sel-toolbar" style={{ left: x, top: y }}>
      <div className="sel-row">
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
      {attr && (
        <div className="sel-credit">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer noopener" title={attr.source}>
              {creditLabel(attr)}
            </a>
          ) : (
            <span title={attr.source}>{creditLabel(attr)}</span>
          )}
          <button className="copy" onClick={copyCredit} title="Copy credit">
            ⧉
          </button>
        </div>
      )}
    </div>
  )
}
