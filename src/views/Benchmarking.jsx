import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import MetricSelector, { findDefaultMetric, displayName } from '../components/MetricSelector'
import ContextPanel from '../components/ContextPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { useData } from '../context/DataContext'
import { useBenchmarkData } from '../hooks/useBenchmarkData'
import { formatValue, domainLabel } from '../utils/formatters'
import { chartTheme } from '../styles/chartTheme'

function domainToSlug(domain) {
  const d = (domain || '').toLowerCase()
  if (d.includes('cost') || d.includes('expenditure')) return 'expenditure-allowances'
  if (d.includes('financial') || d.includes('financeability') || d.includes('return') || d.includes('risk')) return 'aligning-risk-and-return'
  return 'svt-overview'
}

export default function Benchmarking() {
  usePageTitle('Benchmarking')
  const { metricId: routeMetricId } = useParams()

  const [mode, setMode] = useState('__priority__')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMetric, setSelectedMetric] = useState(
    routeMetricId ? Number(routeMetricId) : null
  )
  const [selectedYear, setSelectedYear] = useState(null)
  const [showSplit, setShowSplit] = useState(false)
  const [sortAsc, setSortAsc] = useState(true)
  const [contextOpen, setContextOpen] = useState(false)

  const { appointees, metrics } = useData()
  const { data, loading, error } = useBenchmarkData(selectedMetric)

  // Route param sync
  useEffect(() => {
    if (routeMetricId) setSelectedMetric(Number(routeMetricId))
  }, [routeMetricId])

  // Auto-select default metric when metrics first load
  useEffect(() => {
    if (selectedMetric != null || !metrics?.length) return
    const id = findDefaultMetric(metrics)
    if (id != null) setSelectedMetric(id)
  }, [metrics, selectedMetric])

  // If routed to a non-priority metric, switch to search mode once metrics load
  useEffect(() => {
    if (!routeMetricId || !metrics?.length) return
    const m = metrics.find(x => x.id === Number(routeMetricId))
    if (m && !m.is_svt_priority) {
      setMode('__search__')
      setSearchQuery(m.name || '')
    }
  }, [metrics]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleModeChange(newMode) {
    setMode(newMode)
    setSearchQuery('')
    setContextOpen(false)
    if (newMode === '__priority__' && metrics?.length) {
      const id = findDefaultMetric(metrics)
      if (id != null) {
        setSelectedMetric(id)
        setSelectedYear(null)
      }
    }
  }

  function handleMetricChange(id) {
    setSelectedMetric(id)
    setSelectedYear(null)
    setContextOpen(false)
  }

  const years = useMemo(() => {
    if (!data) return []
    const set = new Set(data.values.map((v) => v.period))
    return [...set].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
  }, [data])

  useEffect(() => {
    if (years.length) setSelectedYear(years[years.length - 1])
  }, [years])

  const appointeeCodes = useMemo(() => new Set(appointees.map((a) => a.code)), [appointees])
  const companyTypes = useMemo(() => {
    const map = {}
    for (const a of appointees) map[a.code] = a.company_type
    return map
  }, [appointees])

  const { chartData, median } = useMemo(() => {
    if (!data || !selectedYear) return { chartData: [], median: null }
    const yearVals = data.values.filter(
      (v) => v.period === selectedYear && appointeeCodes.has(v.company)
    )
    const byCompany = {}
    for (const v of yearVals) {
      if (!(v.company in byCompany)) byCompany[v.company] = v.value
    }
    const entries = Object.entries(byCompany)
      .map(([company, value]) => ({ company, value, type: companyTypes[company] || 'WaSC' }))
      .sort((a, b) => sortAsc ? a.value - b.value : b.value - a.value)

    const sorted = entries.map((e) => e.value).sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const med = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]

    return { chartData: entries, median: med }
  }, [data, selectedYear, appointeeCodes, companyTypes, sortAsc])

  const wascData = chartData.filter((d) => d.type === 'WaSC')
  const wocData = chartData.filter((d) => d.type === 'WoC')
  const unit = data?.unit || ''
  const contextSlug = data ? domainToSlug(data.taxonomy_domain) : null

  const closeContext = useCallback(() => setContextOpen(false), [])

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-heading font-bold text-fs-primary mb-1">Benchmarking</h1>
        <p className="text-sm text-fs-text-muted mb-4">
          Compare metrics across all 20 primary appointees
        </p>

        <div className="rounded-fs-md border border-fs-border bg-fs-surface p-4 shadow-fs mb-4">
          <p className="text-xs font-medium text-fs-text mb-2">Select metric</p>
          <MetricSelector
            metrics={metrics || []}
            mode={mode}
            onModeChange={handleModeChange}
            selectedMetricId={selectedMetric}
            onMetricChange={handleMetricChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-6">
          {years.length > 1 && (
            <select
              className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm shadow-fs focus:border-fs-primary focus:outline-none"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="rounded-fs-sm border border-fs-border bg-white px-3 py-2 text-sm shadow-fs hover:bg-gray-50"
          >
            Sort {sortAsc ? '\u2191' : '\u2193'}
          </button>
          <label className="flex items-center gap-2 text-sm text-fs-text-muted">
            <input type="checkbox" checked={showSplit} onChange={(e) => setShowSplit(e.target.checked)} className="rounded border-fs-border" />
            Split WaSC / WoC
          </label>
        </div>

        {loading && <LoadingSpinner message="Loading benchmark data..." />}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {data && !loading && (
          <>
            <div className="mb-2 flex items-center gap-3">
              <div className="text-sm text-fs-text-muted">
                <span className="font-heading font-bold text-fs-text">{displayName({ id: selectedMetric, name: data.name })}</span>
                {' \u00B7 '}
                {domainLabel(data.taxonomy_domain)} {'\u00B7'} {unit} {'\u00B7'} {selectedYear}
              </div>
              <button
                onClick={() => setContextOpen(!contextOpen)}
                className="inline-flex items-center gap-1 rounded-fs-sm border border-fs-border bg-white px-2 py-1 text-xs text-fs-text-muted hover:text-fs-secondary hover:border-fs-secondary transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Methodology
              </button>
            </div>

            {!showSplit ? (
              <ChartPanel data={chartData} median={median} unit={unit} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-heading font-bold text-fs-text-muted mb-2">Water & Sewerage Companies (WaSC)</h3>
                  <ChartPanel data={wascData} median={median} unit={unit} />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-fs-text-muted mb-2">Water Only Companies (WoC)</h3>
                  <ChartPanel data={wocData} median={median} unit={unit} />
                </div>
              </div>
            )}

            {/* Data table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-fs-border text-left text-xs text-fs-text-muted uppercase tracking-wider">
                    <th className="pb-2 pr-4">Company</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4 text-right">Value</th>
                    <th className="pb-2 text-right">vs Median</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => {
                    const diff = median != null ? row.value - median : null
                    const isSvt = row.company === 'SVT' || row.company === 'SVE'
                    return (
                      <tr key={row.company} className={`border-b border-fs-border/30 ${isSvt ? 'bg-fs-secondary-light font-medium' : ''}`}>
                        <td className="py-1.5 pr-4">{row.company}</td>
                        <td className="py-1.5 pr-4 text-fs-text-muted">{row.type}</td>
                        <td className="py-1.5 pr-4 text-right font-mono">{formatValue(row.value, unit)}</td>
                        <td className="py-1.5 text-right font-mono">
                          {diff != null ? (
                            <span className="text-fs-text-muted">
                              {diff > 0 ? '+' : ''}{formatValue(diff, unit)}
                            </span>
                          ) : '\u2014'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {contextOpen && contextSlug && (
        <ContextPanel slug={contextSlug} topic={data?.name} onClose={closeContext} />
      )}
    </div>
  )
}

function ChartPanel({ data, median, unit }) {
  if (!data.length) return <p className="text-fs-text-muted text-sm">No data available</p>

  const height = Math.max(300, data.length * 28)

  return (
    <div className="rounded-fs-md border border-fs-border bg-fs-surface p-4 shadow-fs">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridColor} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#6b6b6b' }} />
          <YAxis type="category" dataKey="company" tick={{ fontSize: 12, fill: '#2D2D2D' }} width={40} />
          <Tooltip
            formatter={(val) => [formatValue(val, unit), 'Value']}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${chartTheme.tooltipBorder}`, fontFamily: "'Times New Roman', serif" }}
          />
          {median != null && (
            <ReferenceLine
              x={median}
              stroke={chartTheme.refLineColor}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Median', fill: chartTheme.refLineColor, fontSize: 11, position: 'top' }}
            />
          )}
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell
                key={entry.company}
                fill={entry.company === 'SVT' || entry.company === 'SVE' ? chartTheme.svtColor : chartTheme.otherColor}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
