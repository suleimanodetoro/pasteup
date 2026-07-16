import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { Topbar } from './components/Topbar'
import { Sidebar } from './components/sidebar/Sidebar'
import { CanvasStage } from './components/canvas/CanvasStage'
import { PagesRail } from './components/PagesRail'
import { BottomToolbar } from './components/BottomToolbar'
import { Footer } from './components/Footer'
import { Gallery } from './components/Gallery'
import { TrimModal } from './components/TrimModal'
import { Toasts } from './components/Toasts'

export default function App() {
  const init = useStore((s) => s.init)
  const hydrated = useStore((s) => s.hydrated)
  const view = useStore((s) => s.view)

  useEffect(() => {
    void init()
  }, [init])

  // Flush any pending debounced save before the tab is hidden/closed, so the
  // last action (e.g. a drag that ended <400ms ago) isn't lost.
  useEffect(() => {
    const flush = () => useStore.getState().flushPersist()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useGlobalShortcuts()

  if (!hydrated) {
    return <div className="loading-screen">setting up your cutting mat…</div>
  }

  return (
    <div className="app">
      <Topbar />
      {view === 'studio' ? (
        <>
          <div className="studio">
            <Sidebar />
            <CanvasStage />
            <PagesRail />
            <BottomToolbar />
          </div>
          <Footer />
        </>
      ) : (
        <>
          <Gallery />
          <Footer />
        </>
      )}
      <TrimModal />
      <Toasts />
    </div>
  )
}
