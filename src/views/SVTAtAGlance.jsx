import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import usePageTitle from '../hooks/usePageTitle'
import MetricCard from '../components/MetricCard'
import ContextPanel from '../components/ContextPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { domainLabel } from '../utils/formatters'

const HEADLINES = [
  { label: 'Avg household bill 2025-26', value: '\u00A3463', sub: 'SVE appointee' },
  { label: 'Real WACC (post-tax)', value: '4.03%', sub: 'Nominal equiv. ~6.05%' },
  { label: 'ODI risk range', value: '-0.63% to +1.31%', sub: 'RoRE (P10 / P90)' },
  { label: 'Avg bill 2029-30', value: '\u00A3583', sub: 'End of AMP8' },
]

function domainToSlug(domain) {
  const d = (domain || '').toLowerCase()
  if (d.includes('cost') || d.includes('expenditure')) return 'expenditure-allowances'
  if (d.includes('performance') || d.includes('outcome') || d.includes('odi')) return 'svt-overview'
  if (d.includes('price') || d.includes('determination')) return 'svt-overview'
  if (d.includes('financial') || d.includes('financeability') || d.includes('resilience')) return 'aligning-risk-and-return'
  if (d.includes('risk') || d.includes('return')) return 'aligning-risk-and-return'
  return 'svt-overview'
}

export default function SVTAtAGlance() {
  usePageTitle('SVT at a Glance')
  const { priorityMetrics, loading } = useData()
  const [collapsed, setCollapsed] = useState({})
  const [contextSlug, setContextSlug] = useState(null)
  const [contextTopic, setContextTopic] = useState(null)

  const grouped = useMemo(() => {
    if (!priorityMetrics) return []
    const groups = {}
    for (const m of priorityMetrics) {
      const domain = m.taxonomy_domain || 'Other'
      if (!groups[domain]) groups[domain] = []
      groups[domain].push(m)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [priorityMetrics])

  const handleInfoClick = useCallback((metric) => {
    const name = (metric.canonical_name || '').toLowerCase()
    if (name.includes('wacc') || name.includes('allowed return on capital')) {
      setContextSlug('wacc_buildup')
      setContextTopic('wacc')
    } else {
      setContextSlug(domainToSlug(metric.taxonomy_domain))
      setContextTopic(metric.canonical_name)
    }
  }, [])

  const closePanel = useCallback(() => {
    setContextSlug(null)
    setContextTopic(null)
  }, [])

  const handleExport = useCallback(() => {
    window.print()
  }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const toggle = (domain) =>
    setCollapsed((prev) => ({ ...prev, [domain]: !prev[domain] }))

  return (
    <div className="flex gap-0">
      {/* Print header (hidden on screen, shown in print) */}
      <div className="print-header">
        <h1>SVT Regulatory Intelligence Briefing</h1>
        <div className="print-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="print-brand">Analysis by Fox Stephens</div>
      </div>

      <div className={`flex-1 min-w-0 transition-all duration-200`}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-heading font-bold text-fs-primary">SVT at a Glance</h1>
          <button
            onClick={handleExport}
            aria-label="Export briefing"
            className="no-print px-3 py-1.5 text-xs font-medium rounded-fs-sm border border-fs-border bg-white text-fs-text hover:border-fs-primary hover:text-fs-primary transition-colors"
            data-print-hide
          >
            Export briefing
          </button>
        </div>
        <p className="text-sm text-fs-text-muted mb-6">
          Key metrics from the Ofwat PR24 Final Determination for Severn Trent Water
        </p>

        {/* Headline banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {HEADLINES.map((h) => (
            <div
              key={h.label}
              className="rounded-fs-md bg-fs-primary p-4 text-white shadow-fs"
            >
              <div className="text-xs font-medium text-white/60 mb-1">{h.label}</div>
              <div className="text-2xl font-heading font-bold">{h.value}</div>
              <div className="text-xs text-white/50 mt-1">{h.sub}</div>
            </div>
          ))}
        </div>

        {/* SVT Assessment banner */}
        <div className="mb-8 rounded-fs-md border-l-4 border-fs-secondary bg-fs-secondary-light px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-fs-success" />
            <span className="text-fs-text">Ofwat assessment: <span className="font-bold text-fs-primary">Outstanding</span></span>
          </span>
          <span className="text-fs-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-fs-success" />
            <span className="text-fs-text">SVT accepted FD — <span className="font-bold text-fs-primary">not referred to CMA</span></span>
          </span>
          <span className="text-fs-border">|</span>
          <span className="text-fs-text-muted">{'\u00A3'}15bn totex AMP8</span>
          <span className="text-fs-border">|</span>
          <span className="text-fs-text-muted">Plan quality: highest category</span>
        </div>

        {/* Metric cards grouped by domain */}
        {grouped.map(([domain, metrics]) => (
          <div key={domain} className="mb-6">
            <button
              onClick={() => toggle(domain)}
              className="flex items-center gap-2 w-full text-left mb-3 group"
            >
              <span className="text-xs text-fs-text-muted transition-transform inline-block"
                style={{ transform: collapsed[domain] ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              >
                {'\u25BC'}
              </span>
              <h2 className="text-lg font-heading font-bold text-fs-text group-hover:text-fs-primary transition-colors">
                {domainLabel(domain)}
              </h2>
              <span className="text-xs text-fs-text-muted ml-1">
                ({metrics.length} metric{metrics.length !== 1 ? 's' : ''})
              </span>
            </button>
            {!collapsed[domain] && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {metrics.map((m) => {
                  const name = (m.canonical_name || '').toLowerCase()
                  const showRCVLink = name.includes('rcv') || name.includes('regulatory capital value')
                  const showWACCLink = name.includes('wacc') || name.includes('allowed return on capital')
                  return (
                    <div key={`${m.metric_id}-${m.canonical_name}`}>
                      <MetricCard metric={m} onInfoClick={handleInfoClick} />
                      {showRCVLink && (
                        <Link to="/learn/rcv-journey" className="block mt-1 text-[10px] text-fs-primary hover:underline">
                          See RCV history →
                        </Link>
                      )}
                      {showWACCLink && (
                        <Link to="/learn/equity-bridge" className="block mt-1 text-[10px] text-fs-primary hover:underline">
                          Explore equity bridge →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {contextSlug && (
        <ContextPanel slug={contextSlug} topic={contextTopic} onClose={closePanel} />
      )}
    </div>
  )
}
