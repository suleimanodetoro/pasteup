import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { blobToDataURL } from '../lib/image'

function isTyping(): boolean {
  const el = document.activeElement
  return (
    el instanceof HTMLElement &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
  )
}

export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.view !== 'studio') return
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z') {
        if (isTyping()) return
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        if (isTyping()) return
        e.preventDefault()
        s.redo()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping() || s.trimTargetId) return
        if (s.selectedId) {
          e.preventDefault()
          s.deleteClipping(s.selectedId)
        }
        return
      }
      if (e.key === 'Escape') {
        if (!s.trimTargetId) s.select(null)
      }
    }

    const onPaste = async (e: ClipboardEvent) => {
      const s = useStore.getState()
      if (s.view !== 'studio' || isTyping()) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            try {
              const dataURL = await blobToDataURL(file)
              await s.addImage(dataURL)
            } catch {
              s.pushToast('Could not paste that image.', 'error')
            }
            break
          }
        }
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [])
}
