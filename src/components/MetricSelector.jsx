/**
 * MetricSelector — pure render component, zero internal state.
 *
 * Props:
 *   metrics          – full array of metric objects
 *   selectedDomain   – current domain value (e.g. '__priority__', '1. Cost Assessment')
 *   onDomainChange   – (domainValue) => void
 *   selectedMetricId – current metric id (number | null)
 *   onMetricChange   – (metricId) => void
 */

const DOMAIN_OPTIONS = [
  { value: '__all__', label: 'All domains' },
  { value: '__priority__', label: 'Priority metrics' },
  { value: '1. Cost Assessment', label: 'Cost assessment' },
  { value: '2. Performance Commitments', label: 'Performance commitments' },
  { value: '3. Outcomes & ODIs', label: 'Outcomes & ODIs' },
  { value: '4. Price Determination', label: 'Price determination' },
  { value: '5. Financial Resilience', label: 'Financial resilience' },
  { value: '6. Risk & Return', label: 'Risk & uncertainty' },
]

// Clean display names for priority metrics (keyed by metric id)
const DISPLAY_NAMES = {
  10918: 'Average household bill (£/customer)',
  13896: 'WaSC average bill — real (£)',
  2114:  'Real WACC — post-tax (%)',
  11221: 'Allowed return on RCV (%)',
  2497:  'Leakage (Ml/d)',
  1728:  'Leakage — PCL reduction (%)',
  1829:  'Supply interruptions (mins)',
  1982:  'Pollution incidents — PCL',
  1359:  'Internal sewer flooding — PCL',
  1849:  'External sewer flooding — PCL',
  2429:  'Per capita consumption (%)',
  1758:  'Mains repairs — PCL',
  1766:  'Biodiversity — PCL',
  2287:  'Storm overflow spills — PCL',
  629:   'Compliance risk index',
  1742:  'Modelled base costs — Water (£m)',
  11953: 'Modelled base costs — Wastewater (£m)',
  9563:  'Enhancement totex — Water (£m)',
  9597:  'Enhancement totex — Wastewater (£m)',
  9564:  'WINEP allowance (£m)',
  9689:  'CPIH adjustment',
  10784: 'Opening RCV — April 2025 (£m)',
  14022: 'Total RCV — real (£m)',
  11212: 'Notional gearing (%)',
  11214: 'AICR (ratio)',
  11216: 'FFO / net debt (%)',
  9645:  'Net ODI P10 (% RoRE)',
  10341: 'Net ODI P90 (% RoRE)',
  56:    'C-MeX outperformance (£m)',
  11835: 'D-MeX outperformance (£m)',
}

/** Get display name for a metric — uses clean name if available, appends unit for non-priority */
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

export function getMetricsForDomain(metrics, domain) {
  if (!metrics?.length) return []
  if (domain === '__priority__') return metrics.filter(m => !!m.is_svt_priority)
  if (domain === '__all__') return metrics
  return metrics.filter(m => m.taxonomy_domain === domain)
}

export function findDefaultForDomain(metrics, domain) {
  const pool = getMetricsForDomain(metrics, domain)
  if (!pool.length) return null
  if (domain === '__priority__' || domain === '__all__') {
    for (const search of DEFAULT_PRIORITY_SEARCHES) {
      const found = pool.find(m => {
        const name = (DISPLAY_NAMES[m.id] || m.name || '').toLowerCase()
        return name.includes(search)
      })
      if (found) return found.id
    }
  }
  const sorted = pool.slice().sort((a, b) =>
    displayName(a).localeCompare(displayName(b))
  )
  return sorted[0]?.id ?? null
}

const selectStyle = {
  borderColor: '#005030',
  borderRadius: 6,
  fontSize: 14,
  padding: '8px 12px',
  outline: 'none',
}

export default function MetricSelector({
  metrics,
  selectedDomain,
  onDomainChange,
  selectedMetricId,
  onMetricChange,
}) {
  const metricsArray = Array.isArray(metrics) ? metrics : []
  const pool = getMetricsForDomain(metricsArray, selectedDomain)
  const sorted = pool.slice().sort((a, b) =>
    displayName(a).localeCompare(displayName(b))
  )

  const isLoading = metricsArray.length === 0

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        {/* Domain select */}
        <select
          value={selectedDomain}
          onChange={e => onDomainChange(e.target.value)}
          className="sm:w-[220px] bg-white text-[#2D2D2D] border focus:ring-2 focus:ring-[#005030] cursor-pointer"
          style={selectStyle}
        >
          {DOMAIN_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Metric select */}
        {isLoading ? (
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
            {sorted.map(m => (
              <option key={m.id} value={String(m.id)}>
                {displayName(m)}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
