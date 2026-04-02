import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const DataContext = createContext(null)

// Build-time cache buster — changes on every build so browsers fetch fresh data
const DATA_VERSION = typeof __DATA_VERSION__ !== 'undefined' ? __DATA_VERSION__ : ''

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}

async function fetchJSON(url) {
  const bustUrl = DATA_VERSION ? `${url}?v=${DATA_VERSION}` : url
  const res = await fetch(bustUrl)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

export function DataProvider({ children }) {
  const [companies, setCompanies] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [priorityMetrics, setPriorityMetrics] = useState(null)
  const [knowledgeIndex, setKnowledgeIndex] = useState(null)
  const [svtSummary, setSvtSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Caches for lazy-loaded data
  const benchmarkCache = useRef({})
  const trendCache = useRef({})
  const knowledgeCache = useRef({})

  // Guard against StrictMode double-mount
  const didFetch = useRef(false)

  // Initial load — fetch metrics independently so one failure doesn't block all
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    // Metrics is the critical path — fetch and set state immediately
    fetchJSON('/data/metrics.json')
      .then((met) => setMetrics(met))
      .catch((err) => setError(err.message))

    // Fetch remaining files in parallel
    Promise.all([
      fetchJSON('/data/companies.json'),
      fetchJSON('/data/priority_metrics.json'),
      fetchJSON('/data/trends/SVT.json').catch(() => null),
      fetchJSON('/knowledge/index.json').catch(() => null),
    ])
      .then(([comp, pm, svtTrends, ki]) => {
        setCompanies(comp)
        setPriorityMetrics(pm)
        if (ki) setKnowledgeIndex(ki)
        if (svtTrends) trendCache.current['SVT'] = svtTrends
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Lazy-load SVT summary (only when needed)
  const loadSvtSummary = useCallback(async () => {
    if (svtSummary) return svtSummary
    const data = await fetchJSON('/data/svt_summary.json')
    setSvtSummary(data)
    return data
  }, [svtSummary])

  // Lazy-load knowledge document by slug
  const loadKnowledge = useCallback(async (slug) => {
    if (knowledgeCache.current[slug]) return knowledgeCache.current[slug]
    const data = await fetchJSON(`/knowledge/${slug}.json`)
    knowledgeCache.current[slug] = data
    return data
  }, [])

  // Lazy-load benchmark data for a metric
  const loadBenchmark = useCallback(async (metricId) => {
    if (benchmarkCache.current[metricId]) return benchmarkCache.current[metricId]
    const data = await fetchJSON(`/data/benchmarking/${metricId}.json`)
    benchmarkCache.current[metricId] = data
    return data
  }, [])

  // Lazy-load trend data for a company
  const loadTrend = useCallback(async (companyCode) => {
    if (trendCache.current[companyCode]) return trendCache.current[companyCode]
    const data = await fetchJSON(`/data/trends/${companyCode}.json`)
    trendCache.current[companyCode] = data
    return data
  }, [])

  // Get all primary appointees (WaSC + WoC)
  const appointees = companies
    ? companies.filter((c) => c.company_type === 'WaSC' || c.company_type === 'WoC')
    : []

  const value = {
    companies,
    metrics,
    priorityMetrics,
    knowledgeIndex,
    svtSummary,
    appointees,
    loading,
    error,
    loadSvtSummary,
    loadBenchmark,
    loadTrend,
    loadKnowledge,
    trendCache: trendCache.current,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
