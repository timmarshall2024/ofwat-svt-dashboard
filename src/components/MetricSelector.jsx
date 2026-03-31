/**
 * MetricSelector — two modes:
 *   1. "Priority metrics" — shows 35 curated metrics in a dropdown
 *   2. "Search all metrics" — text search across all 6,063 metrics
 *
 * Props:
 *   metrics          – full array of metric objects
 *   mode             – '__priority__' | '__search__'
 *   onModeChange     – (mode) => void
 *   selectedMetricId – current metric id (number | null)
 *   onMetricChange   – (metricId) => void
 *   searchQuery      – current search text (string)
 *   onSearchChange   – (query) => void
 */

import { useState, useRef, useEffect } from 'react'

// Clean display names for the 35 DB priority metrics (keyed by metric id)
const DISPLAY_NAMES = {
  // 1. Cost Assessment
  10918: 'Average household bill (£/customer)',
  1742:  'Modelled base costs — Water (£m)',
  11524: 'Modelled base costs — Wastewater (£m)',
  9564:  'WINEP allowance (£m)',
  9440:  'Enhancement totex — Wastewater (£m)',
  1062:  'Enhancement totex — Water quality (£m)',
  10822: 'Opening RCV — April 2025 (£m)',
  9865:  'Leakage (Ml/d)',
  3280:  'Water efficiency — uncapped (%)',
  11214: 'AICR (ratio)',
  11216: 'FFO / net debt (%)',
  11212: 'Notional gearing (%)',
  11221: 'Allowed return on RCV (%)',
  // 2. Performance Commitments
  629:   'Compliance risk index',
  1759:  'Mains repairs — PCL (number)',
  1849:  'External sewer flooding (per 10k connections)',
  1359:  'Internal sewer flooding (per 10k connections)',
  2429:  'Per capita consumption (%)',
  1711:  'Greenhouse gas emissions — Water (tCO2e)',
  1776:  'Biodiversity — PCL',
  1944:  'Unplanned outage — PCL (%)',
  // 3. Outcomes & ODIs
  10341: 'Net ODI P90 (% RoRE)',
  10118: 'P10 vs average PCL — Leakage (%)',
  10186: 'P10 vs average PCL — Serious pollution (%)',
  10254: 'P10 vs average PCL — Storm overflows',
  10169: 'P10 vs average PCL — Total pollution',
  9982:  'P10 vs average PCL — Supply interruptions (mins)',
  56:    'C-MeX outperformance (£m)',
  9645:  'Net ODI P10 (% RoRE)',
  // 4. Price Determination
  1660:  'Allowed totex — Wastewater (£m)',
  1659:  'Allowed totex — Water (£m)',
  // 5. Financial Resilience
  14022: 'Total RCV — real (£m)',
  // 6. Risk & Return
  20053: 'Cost of embedded debt (ratio)',
  2114:  'Real WACC — post-tax (%)',
}

export function displayName(metric) {
  if (!metric) return ''
  if (DISPLAY_NAMES[metric.id]) return DISPLAY_NAMES[metric.id]
  const name = metric.name || ''
  return metric.unit ? `${name} (${metric.unit})` : name
}

const DEFAULT_PRIORITY_SEARCHES = ['average household bill', 'household bill', 'bill profile']

export function findDefaultMetric(metrics) {
  if (!metrics?.length) return null
  const priority = metrics.filter(m => !!m.is_svt_priority)
  for (const search of DEFAULT_PRIORITY_SEARCHES) {
    const found = priority.find(m => {
      const name = (DISPLAY_NAMES[m.id] || m.name || '').toLowerCase()
      return name.includes(search)
    })
    if (found) return found.id
  }
  const sorted = priority.slice().sort((a, b) =>
    displayName(a).localeCompare(displayName(b))
  )
  return sorted[0]?.id ?? null
}

export function getPriorityMetrics(metrics) {
  if (!metrics?.length) return []
  return metrics.filter(m => !!m.is_svt_priority)
}

const MAX_SEARCH_RESULTS = 20

export function searchMetrics(metrics, query) {
  if (!metrics?.length || !query || query.length < 2) return []
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const scored = []
  for (const m of metrics) {
    const name = (DISPLAY_NAMES[m.id] || m.name || '').toLowerCase()
    const ref = (m.reference || '').toLowerCase()
    const combined = `${name} ${ref}`
    let matches = 0
    for (const t of terms) {
      if (combined.includes(t)) matches++
    }
    if (matches === 0) continue
    // Score: all terms match > partial, priority first, then alphabetical
    const allMatch = matches === terms.length
    scored.push({ metric: m, allMatch, matches, name })
  }
  scored.sort((a, b) => {
    if (a.allMatch !== b.allMatch) return a.allMatch ? -1 : 1
    if (a.metric.is_svt_priority !== b.metric.is_svt_priority) return a.metric.is_svt_priority ? -1 : 1
    if (a.matches !== b.matches) return b.matches - a.matches
    return a.name.localeCompare(b.name)
  })
  return scored.slice(0, MAX_SEARCH_RESULTS).map(s => s.metric)
}

const MODE_OPTIONS = [
  { value: '__priority__', label: 'Priority metrics' },
  { value: '__search__', label: 'Search all metrics' },
]

const selectStyle = {
  borderColor: '#005030',
  borderRadius: 6,
  fontSize: 14,
  padding: '8px 12px',
  outline: 'none',
}

const inputStyle = {
  ...selectStyle,
  width: '100%',
}

export default function MetricSelector({
  metrics,
  mode,
  onModeChange,
  selectedMetricId,
  onMetricChange,
  searchQuery,
  onSearchChange,
}) {
  const metricsArray = Array.isArray(metrics) ? metrics : []
  const isLoading = metricsArray.length === 0
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const searchResults = mode === '__search__' ? searchMetrics(metricsArray, searchQuery) : []

  // Priority metrics sorted alphabetically
  const prioritySorted = getPriorityMetrics(metricsArray).slice().sort((a, b) =>
    displayName(a).localeCompare(displayName(b))
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        {/* Mode select */}
        <select
          value={mode}
          onChange={e => onModeChange(e.target.value)}
          className="sm:w-[260px] bg-white text-[#2D2D2D] border focus:ring-2 focus:ring-[#005030] cursor-pointer"
          style={selectStyle}
        >
          {MODE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Mode 1: Priority dropdown */}
        {mode === '__priority__' && (
          isLoading ? (
            <select disabled className="flex-1 bg-gray-50 text-gray-400 border cursor-not-allowed" style={selectStyle}>
              <option>Loading metrics...</option>
            </select>
          ) : (
            <select
              value={selectedMetricId != null ? String(selectedMetricId) : ''}
              onChange={e => onMetricChange(Number(e.target.value))}
              className="flex-1 bg-white text-[#2D2D2D] border focus:ring-2 focus:ring-[#005030] cursor-pointer"
              style={selectStyle}
            >
              {selectedMetricId == null && (
                <option value="" disabled>Select a metric...</option>
              )}
              {prioritySorted.map(m => (
                <option key={m.id} value={String(m.id)}>
                  {displayName(m)}
                </option>
              ))}
            </select>
          )
        )}

        {/* Mode 2: Search input */}
        {mode === '__search__' && (
          <div className="flex-1 relative" ref={wrapperRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={isLoading ? 'Loading metrics...' : `Search all ${metricsArray.length.toLocaleString()} metrics...`}
              disabled={isLoading}
              className="w-full bg-white text-[#2D2D2D] border focus:ring-2 focus:ring-[#005030]"
              style={inputStyle}
            />
            {dropdownOpen && searchResults.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-white border border-[#005030] rounded-md shadow-lg">
                {searchResults.map(m => (
                  <li
                    key={m.id}
                    onClick={() => {
                      onMetricChange(m.id)
                      setDropdownOpen(false)
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#005030]/10 ${
                      m.id === selectedMetricId ? 'bg-[#005030]/5 font-medium' : ''
                    }`}
                  >
                    <span>{displayName(m)}</span>
                    {m.is_svt_priority && (
                      <span className="ml-2 text-xs text-[#005030] font-medium">Priority</span>
                    )}
                    {m.reference && (
                      <span className="ml-2 text-xs text-gray-400">{m.reference}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {dropdownOpen && searchQuery && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-3 text-sm text-gray-500">
                No metrics found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
