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
