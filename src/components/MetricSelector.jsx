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

const RECOMMENDED = {
  '1. Cost Assessment': ['allowed totex', 'base cost', 'enhancement'],
  '2. Performance Commitments': ['leakage', 'supply interruptions', 'pollution incidents', 'sewer flooding', 'per capita consumption'],
  '3. Outcomes & ODIs': ['net odi', 'odi rate', 'rore'],
  '4. Price Determination': ['allowed revenue', 'rcv', 'household bill'],
  '5. Financial Resilience': ['wacc', 'allowed return', 'gearing', 'aicr'],
  '6. Risk & Return': ['p10', 'p50', 'p90'],
}

const DEFAULT_PRIORITY_SEARCHES = ['average household bill', 'household bill', 'bill profile']

function matchesRecommended(metric, domain) {
  const searches = RECOMMENDED[domain]
  if (!searches) return false
  const name = (metric.name || '').toLowerCase()
  return searches.some(s => name.includes(s))
}

function findDefaultForDomain(metrics, domain) {
  if (domain === '__priority__' || domain === '__all__') {
    const pool = domain === '__priority__'
      ? metrics.filter(m => m.is_svt_priority)
      : metrics
    for (const search of DEFAULT_PRIORITY_SEARCHES) {
      const found = pool.find(m => m.name && m.name.toLowerCase().includes(search))
      if (found) return found.id
    }
    const sorted = pool.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return sorted[0]?.id ?? null
  }
  // Specific domain — pick first recommended, else first alphabetically
  const domainMetrics = metrics.filter(m => m.taxonomy_domain === domain)
  const recs = RECOMMENDED[domain] || []
  for (const search of recs) {
    const found = domainMetrics.find(m => m.name && m.name.toLowerCase().includes(search))
    if (found) return found.id
  }
  const sorted = domainMetrics.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  return sorted[0]?.id ?? null
}

export default function MetricSelector({ value, onChange }) {
  const { metrics: contextMetrics } = useMetricData()
  const allMetrics = contextMetrics || []

  // Domain always starts at __priority__ — set directly, never overridden on mount
  const [domain, setDomain] = useState('__priority__')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Track whether we've done the one-time init (auto-select default or sync from route)
  const didInitRef = useRef(false)
  // Track previous value prop so sync effect only fires on actual changes
  const prevValueRef = useRef(value)

  // One-time init: when metrics first load, either auto-select default or sync
  // domain from a routed value. Runs exactly once.
  useEffect(() => {
    if (didInitRef.current || !allMetrics.length) return
    didInitRef.current = true

    if (!value) {
      // No metric selected — pick default for priority domain
      const defaultId = findDefaultForDomain(allMetrics, '__priority__')
      if (defaultId) {
        prevValueRef.current = defaultId
        onChange(defaultId)
      }
    } else {
      // Value already set (e.g. from route param) — sync domain to match
      const m = allMetrics.find(x => x.id === value)
      if (m) {
        if (m.is_svt_priority) {
          // Already __priority__, no-op
        } else if (m.taxonomy_domain) {
          setDomain(m.taxonomy_domain)
        }
      }
    }
  }, [allMetrics.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync domain when value changes externally (e.g. MetricExplorer → Benchmarking)
  // Only fires on actual value changes, never on mount.
  useEffect(() => {
    if (prevValueRef.current === value) return
    prevValueRef.current = value
    if (!value || !allMetrics.length) return
    const m = allMetrics.find(x => x.id === value)
    if (!m) return
    if (domain === '__priority__' && m.is_svt_priority) return
    if (domain === m.taxonomy_domain) return
    if (m.is_svt_priority) {
      setDomain('__priority__')
    } else if (m.taxonomy_domain) {
      setDomain(m.taxonomy_domain)
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

  // Domain change: update domain, auto-select first metric, call onChange
  function handleDomainChange(newDomain) {
    setDomain(newDomain)
    setQuery('')
    setOpen(false)
    if (!allMetrics.length) return
    const defaultId = findDefaultForDomain(allMetrics, newDomain)
    if (defaultId) {
      prevValueRef.current = defaultId
      onChange(defaultId)
    }
  }

  // Filtered metrics for current domain + search query
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
        (m.name || '').toLowerCase().includes(q) ||
        (m.reference || '').toLowerCase().includes(q)
      )
    }
    return filtered
  }, [allMetrics, domain, query])

  // Group metrics for the dropdown list
  const groups = useMemo(() => {
    // Priority view: group by domain (same as before)
    if (domain === '__priority__') {
      const byDomain = {}
      for (const m of filteredMetrics) {
        const d = m.taxonomy_domain || 'Other'
        if (!byDomain[d]) byDomain[d] = []
        byDomain[d].push(m)
      }
      return Object.entries(byDomain)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([d, items]) => ({
          header: DOMAIN_OPTIONS.find(o => o.value === d)?.label || d.replace(/^\d+\.\s*/, ''),
          style: 'domain',
          items: items.sort((a, b) => a.name.localeCompare(b.name)),
          showDot: false,
        }))
    }

    // All domains: flat alphabetical, no grouping
    if (domain === '__all__') {
      return [{
        header: null,
        style: null,
        items: filteredMetrics.slice().sort((a, b) => a.name.localeCompare(b.name)),
        showDot: false,
      }]
    }

    // Specific domain: recommended group + remaining group
    const recs = !query
      ? filteredMetrics.filter(m => matchesRecommended(m, domain))
      : []
    const recIds = new Set(recs.map(m => m.id))
    const remaining = filteredMetrics.filter(m => !recIds.has(m.id))

    const result = []
    if (recs.length > 0) {
      result.push({
        header: 'Recommended',
        style: 'recommended',
        items: recs.sort((a, b) => a.name.localeCompare(b.name)),
        showDot: true,
      })
    }
    const otherItems = query ? filteredMetrics : remaining
    if (otherItems.length > 0) {
      result.push({
        header: recs.length > 0 ? 'All metrics' : null,
        style: recs.length > 0 ? 'all' : null,
        items: otherItems.slice().sort((a, b) => a.name.localeCompare(b.name)),
        showDot: false,
      })
    }
    return result
  }, [filteredMetrics, domain, query])

  const selectedMetric = value ? allMetrics.find(m => m.id === value) : null

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col sm:flex-row rounded-fs-md border border-[#E0E0E0] bg-white shadow-fs overflow-hidden">
        {/* Domain filter */}
        <div className="sm:w-[200px] sm:min-w-[200px] border-b sm:border-b-0 sm:border-r border-[#E0E0E0]">
          <select
            value={domain}
            onChange={e => handleDomainChange(e.target.value)}
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
              {filteredMetrics.length === 0 ? (
                <div className="px-3 py-4 text-sm text-[#6b6b6b] text-center">No results</div>
              ) : (
                groups.map((group, gi) => (
                  <div key={gi}>
                    {group.header && (
                      <div className={`sticky top-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider ${
                        group.style === 'domain' || group.style === 'recommended'
                          ? 'bg-[#E8F5E9] text-[#005030]'
                          : 'bg-[#F5F5F5] text-[#6b6b6b]'
                      }`}>
                        {group.style === 'recommended' || group.style === 'all'
                          ? `── ${group.header} ──`
                          : group.header}
                      </div>
                    )}
                    {group.items.map(m => (
                      <button
                        key={m.id}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-[#E8F5E9] ${
                          m.id === value ? 'bg-[#E8F5E9] font-medium' : ''
                        }`}
                        onClick={() => {
                          prevValueRef.current = m.id
                          onChange(m.id)
                          setQuery('')
                          setOpen(false)
                        }}
                      >
                        {group.showDot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#005030] shrink-0" />
                        )}
                        <span className="truncate text-[#2D2D2D] flex-1">{m.name}</span>
                        {m.unit && <span className="text-xs text-[#6b6b6b] whitespace-nowrap shrink-0">{m.unit}</span>}
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
