import { useState } from 'react'
import { UploadPanel } from './UploadPanel'
import { SearchPanel } from './SearchPanel'
import { UrlPanel } from './UrlPanel'
import { SEARCH_SOURCES } from '../../sources'

// Tabs are derived from the source registry: the fixed Upload / URL panels
// bookend one tab per registered ImageSource, so adding a source object to
// SEARCH_SOURCES is enough to surface it here.
const TABS: { id: string; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  ...SEARCH_SOURCES.map((s) => ({ id: s.id, label: s.label })),
  { id: 'url', label: 'URL' },
]

export function Sidebar() {
  const [tab, setTab] = useState<string>('upload')
  const activeSource = SEARCH_SOURCES.find((s) => s.id === tab)

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sidebar-body">
        {tab === 'upload' && <UploadPanel />}
        {tab === 'url' && <UrlPanel />}
        {activeSource && <SearchPanel key={activeSource.id} source={activeSource} />}
      </div>
    </aside>
  )
}
