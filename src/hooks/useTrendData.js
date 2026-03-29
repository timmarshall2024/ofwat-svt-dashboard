import { useState, useEffect, useCallback } from 'react'
import { useData } from '../context/DataContext'

/**
 * Lazy-load trend data for one or more companies.
 * Returns { trendsByCompany, loading, addCompany, removeCompany, companies }
 */
export function useTrendData(initialCompanies = ['SVT']) {
  const { loadTrend, trendCache } = useData()
  const [selectedCompanies, setSelectedCompanies] = useState(initialCompanies)
  const [trendsByCompany, setTrendsByCompany] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const toLoad = selectedCompanies.filter((c) => !trendsByCompany[c])
    if (toLoad.length === 0) return

    setLoading(true)
    Promise.all(toLoad.map((c) => loadTrend(c).then((d) => [c, d])))
      .then((results) => {
        if (cancelled) return
        setTrendsByCompany((prev) => {
          const next = { ...prev }
          for (const [code, data] of results) next[code] = data
          return next
        })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedCompanies, loadTrend])

  // Also seed from cache on mount
  useEffect(() => {
    if (trendCache['SVT'] && !trendsByCompany['SVT']) {
      setTrendsByCompany((prev) => ({ ...prev, SVT: trendCache['SVT'] }))
    }
  }, [trendCache])

  const addCompany = useCallback((code) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(code) || prev.length >= 5) return prev
      return [...prev, code]
    })
  }, [])

  const removeCompany = useCallback((code) => {
    if (code === 'SVT') return // SVT always shown
    setSelectedCompanies((prev) => prev.filter((c) => c !== code))
  }, [])

  const setCompanies = useCallback((codes) => {
    const withSvt = codes.includes('SVT') ? codes : ['SVT', ...codes]
    setSelectedCompanies(withSvt.slice(0, 5))
  }, [])

  return {
    trendsByCompany,
    loading,
    selectedCompanies,
    addCompany,
    removeCompany,
    setCompanies,
  }
}
