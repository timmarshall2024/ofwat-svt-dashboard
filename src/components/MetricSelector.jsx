import { useState, useRef, useEffect } from 'react'
import { useMetricData } from '../hooks/useMetricData'

export default function MetricSelector({ value, onChange, placeholder = 'Search metrics...' }) {
  const { searchMetrics } = useMetricData()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (query.length >= 2) {
      const found = searchMetrics(query).slice(0, 50)
      setResults(found)
      setOpen(true)
    } else if (query.length === 0 && open) {
      const found = searchMetrics('', { priorityOnly: true })
      setResults(found)
    } else {
      setResults([])
    }
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedMetric = value
    ? searchMetrics('').find((m) => m.id === value)
    : null

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <input
        type="text"
        className="w-full rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm placeholder-fs-text-muted shadow-fs focus:border-fs-primary focus:outline-none focus:ring-1 focus:ring-fs-primary"
        placeholder={selectedMetric ? selectedMetric.name : placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true)
          if (query.length === 0) {
            setResults(searchMetrics('', { priorityOnly: true }))
          }
        }}
      />
      {selectedMetric && !open && (
        <div className="mt-1 text-xs text-fs-text-muted truncate">
          {selectedMetric.taxonomy_domain} {'\u00B7'} {selectedMetric.unit}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-40 mt-1 w-full max-h-72 overflow-y-auto rounded-fs-md border border-fs-border bg-white shadow-fs-md">
          {results.map((m) => (
            <button
              key={m.id}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-fs-secondary-light border-b border-fs-border/30 transition-colors ${
                m.id === value ? 'bg-fs-secondary-light font-medium' : ''
              }`}
              onClick={() => {
                onChange(m.id)
                setQuery('')
                setOpen(false)
              }}
            >
              <div className="truncate font-medium text-fs-text">{m.name}</div>
              <div className="text-xs text-fs-text-muted truncate">
                {m.taxonomy_domain} {'\u00B7'} {m.unit || 'no unit'}
                {m.is_svt_priority && ' \u00B7 SVT Priority'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
