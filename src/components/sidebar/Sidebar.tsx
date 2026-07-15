import { useState } from 'react'
import { UploadPanel } from './UploadPanel'
import { SearchPanel } from './SearchPanel'
import { UrlPanel } from './UrlPanel'
import { wikimediaSource, openverseSource } from '../../sources'

type TabId = 'upload' | 'art' | 'photos' | 'url'

const TABS: { id: TabId; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'art', label: 'Art' },
  { id: 'photos', label: 'Photos' },
  { id: 'url', label: 'URL' },
]

export function Sidebar() {
  const [tab, setTab] = useState<TabId>('upload')

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
        {tab === 'art' && <SearchPanel source={wikimediaSource} />}
        {tab === 'photos' && <SearchPanel source={openverseSource} />}
        {tab === 'url' && <UrlPanel />}
      </div>
    </aside>
  )
}
