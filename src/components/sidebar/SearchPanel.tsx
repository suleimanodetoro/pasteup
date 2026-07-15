import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { loadRemoteImageAsDataURL } from '../../lib/image'
import type { ImageSource, SearchResult } from '../../types'

export function SearchPanel({ source }: { source: ImageSource }) {
  const addImage = useStore((s) => s.addImage)
  const pushToast = useStore((s) => s.pushToast)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(q: string, p: number, append: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await source.search(q, p)
      setResults((prev) => (append ? [...prev, ...res.results] : res.results))
      setHasMore(res.hasMore)
      setPage(p)
    } catch {
      setError('Search failed — please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  async function dice() {
    if (!source.random) return
    setLoading(true)
    setError(null)
    try {
      const res = await source.random()
      setResults(res.results)
      setHasMore(false)
      setPage(0)
    } catch {
      setError('Could not fetch surprises right now.')
    } finally {
      setLoading(false)
    }
  }

  async function pick(r: SearchResult) {
    setAddingId(r.id)
    try {
      const dataURL = await loadRemoteImageAsDataURL(r.full)
      await addImage(dataURL, { attribution: r.attribution })
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Could not add that image.', 'error')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div>
      <form
        className="field"
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim()) void run(query.trim(), 0, false)
        }}
      >
        <input
          className="input"
          placeholder={`Search ${source.label.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" type="submit" title="Search">
          🔍
        </button>
        {source.random && (
          <button className="btn" type="button" title="Surprise me" onClick={() => void dice()}>
            🎲
          </button>
        )}
      </form>

      {source.note && <p className="help">{source.note}</p>}
      {error && (
        <p className="help" style={{ color: 'var(--accent-deep)' }}>
          {error}
        </p>
      )}

      <div className="results">
        {results.map((r) => {
          const attr = r.attribution
          const cap = [attr?.author, attr?.license].filter(Boolean).join(' · ')
          return (
            <button
              key={r.id}
              className="result"
              onClick={() => void pick(r)}
              disabled={addingId === r.id}
              title={r.title || 'Add to page'}
            >
              <img src={r.thumb} loading="lazy" alt={r.title || ''} />
              {addingId === r.id ? (
                <span className="cap">adding…</span>
              ) : (
                cap && <span className="cap">{cap}</span>
              )}
            </button>
          )
        })}
      </div>

      {loading && <div className="spinner" />}
      {!loading && hasMore && (
        <button
          className="btn"
          style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
          onClick={() => void run(query.trim(), page + 1, true)}
        >
          Load more
        </button>
      )}
      {!loading && results.length === 0 && !error && (
        <p className="muted" style={{ marginTop: 14 }}>
          Search for something lovely to begin — or roll the dice.
        </p>
      )}
    </div>
  )
}
