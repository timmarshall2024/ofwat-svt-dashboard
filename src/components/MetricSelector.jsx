import { useState, useRef, useEffect, useMemo } from 'react'
import { useMetricData } from '../hooks/useMetricData'

const DOMAIN_OPTIONS = [
  { value: '__all__', label: 'All domains' },
  { value: '__priority__', label: 'Priority metrics', separator: true },
  { value: '1. Cost Assessment', label: 'Cost assessment' },
  { value: '2. Performance Commitments', label: 'Performance commitments' },
  { value: '3. Outcomes & ODIs', label: 'Outcomes & ODIs' },
  { value: '4. Price Determination', label: 'Price determination' },
  { value: '5. Financial Resilience', label: 'Financial resilience' },
  { value: '6. Risk & Return', label: 'Risk & uncertainty' },
]

const DEFAULT_SEARCHES = [
  'bill profile for 2025-30',
  'average household bill',
  'household bill',
]

export default function MetricSelector({ metrics: metricsProp, value, onChange, defaultPriorityOnly = true }) {
  const { metrics: contextMetrics, searchMetrics } = useMetricData()
  const allMetrics = metricsProp || contextMetrics || []

  const [domain, setDomain] = useState('__priority__')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [initialised, setInitialised] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const skipSyncRef = useRef(false)

  // Set default metric on first load if none selected
  useEffect(() => {
    if (initialised || !allMetrics.length) return
    setInitialised(true)
    if (value) {
      // If a metric is already selected via route, match the domain
      const m = allMetrics.find(x => x.id === value)
      if (m) {
        if (m.is_svt_priority) {
          setDomain('__priority__')
        } else if (m.taxonomy_domain) {
          setDomain(m.taxonomy_domain)
        }
      }
      skipSyncRef.current = true
      return
    }
    // No value yet — select default metric (household bill)
    let def = null
    for (const search of DEFAULT_SEARCHES) {
      def = allMetrics.find(x =>
        x.is_svt_priority && x.name && x.name.toLowerCase().includes(search)
      )
      if (def) break
    }
    if (def) {
      setDomain('__priority__')
      skipSyncRef.current = true
      onChange(def.id)
    }
  }, [allMetrics, value, initialised, onChange])

  // Sync domain when value changes externally (e.g. navigation from MetricExplorer)
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }
    if (!value || !allMetrics.length) return
    const m = allMetrics.find(x => x.id === value)
    if (!m) return
    // If current domain is priority and metric is priority, keep it
    if (domain === '__priority__' && m.is_svt_priority) return
    // If current domain matches metric's domain, keep it
    if (domain === m.taxonomy_domain) return
    // If all domains, keep it
    if (domain === '__all__') return
    // Otherwise switch to correct domain
    if (m.is_svt_priority) {
      setDomain('__priority__')
    } else {
      setDomain(m.taxonomy_domain || '__all__')
    }
  }, [value, allMetrics, domain])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filtered metrics based on domain + search query
  const filteredMetrics = useMemo(() => {
    if (!allMetrics.length) return []
    let filtered
    if (domain === '__priority__') {
      filtered = allMetrics.filter(m => m.is_svt_priority)
    } else if (domain === '__all__') {
      filtered = allMetrics
    } else {
      filtered = allMetrics.filter(m => m.taxonomy_domain === domain)
    }
    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.reference || '').toLowerCase().includes(q)
      )
    }
    return filtered
  }, [allMetrics, domain, query])

  // Group metrics by domain (only for priority view)
  const groupedMetrics = useMemo(() => {
    if (domain !== '__priority__') {
      return [{ domain: null, items: filteredMetrics.slice().sort((a, b) => a.name.localeCompare(b.name)) }]
    }
    const groups = {}
    for (const m of filteredMetrics) {
      const d = m.taxonomy_domain || 'Other'
      if (!groups[d]) groups[d] = []
      groups[d].push(m)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([domain, items]) => ({
        domain,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
  }, [filteredMetrics, domain])

  const totalFiltered = filteredMetrics.length
  const selectedMetric = value ? allMetrics.find(m => m.id === value) : null

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col sm:flex-row rounded-fs-md border border-[#E0E0E0] bg-white shadow-fs overflow-hidden">
        {/* Domain filter */}
        <div className="sm:w-[200px] sm:min-w-[200px] border-b sm:border-b-0 sm:border-r border-[#E0E0E0]">
          <select
            value={domain}
            onChange={e => { setDomain(e.target.value); setQuery(''); setOpen(false) }}
            className="w-full px-3 py-2.5 text-sm bg-white text-[#2D2D2D] border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005030] cursor-pointer appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6b6b' d='M3 5l3 3 3-3'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {DOMAIN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.separator ? `── ${opt.label} ──` : opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Metric search/dropdown */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            name="metric-search"
            className="w-full px-3 py-2.5 text-sm bg-white text-[#2D2D2D] placeholder-[#6b6b6b] border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005030] [&::-webkit-search-cancel-button]:hidden"
            placeholder={selectedMetric ? selectedMetric.name : 'Type to search metrics...'}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 left-0 right-0 mt-0 max-h-[320px] overflow-y-auto bg-white border border-[#E0E0E0] border-t-0 rounded-b-fs-md shadow-fs-md">
              {totalFiltered === 0 ? (
                <div className="px-3 py-4 text-sm text-[#6b6b6b] text-center">No results</div>
              ) : (
                groupedMetrics.map((group, gi) => (
                  <div key={gi}>
                    {group.domain && (
                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider bg-[#E8F5E9] text-[#005030]">
                        {DOMAIN_OPTIONS.find(d => d.value === group.domain)?.label || group.domain.replace(/^\d+\.\s*/, '')}
                      </div>
                    )}
                    {group.items.map(m => (
                      <button
                        key={m.id}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors hover:bg-[#E8F5E9] ${
                          m.id === value ? 'bg-[#E8F5E9] font-medium' : ''
                        }`}
                        onClick={() => {
                          onChange(m.id)
                          setQuery('')
                          setOpen(false)
                        }}
                      >
                        <span className="truncate text-[#2D2D2D]">{m.name}</span>
                        {m.unit && <span className="text-xs text-[#6b6b6b] whitespace-nowrap flex-shrink-0">{m.unit}</span>}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Warning when showing all metrics */}
      {domain === '__all__' && !query && (
        <p className="mt-1 text-xs text-[#F47321]">
          Showing all {allMetrics.length.toLocaleString()} metrics — select a domain to narrow
        </p>
      )}
    </div>
  )
}
