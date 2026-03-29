import { createContext, useContext } from 'react'

const MockContext = createContext(null)

export const MOCK_DATA = {
  companies: [
    { id: 1, code: 'SVE', name: 'Severn Trent Water', type: 'WaSC', svt_group: true },
    { id: 2, code: 'ANH', name: 'Anglian Water', type: 'WaSC', svt_group: false },
  ],
  metrics: [
    { id: 1, name: 'Test metric', reference: 'TEST01', category: 'CA', unit: '%', description: 'Test' },
  ],
  priorityMetrics: [
    {
      metric_id: 1,
      canonical_name: 'Test metric',
      taxonomy_domain: '1. Cost Assessment',
      unit: '%',
      svt_value: 0.05,
      sector_median: 0.04,
      latest_period: '2029-30',
    },
  ],
  knowledgeIndex: { documents: [] },
  svtSummary: null,
  appointees: [
    { id: 1, code: 'SVE', name: 'Severn Trent Water', company_type: 'WaSC' },
    { id: 2, code: 'ANH', name: 'Anglian Water', company_type: 'WaSC' },
  ],
  loading: false,
  error: null,
  loadSvtSummary: async () => null,
  loadBenchmark: async () => [],
  loadTrend: async () => ({ company: 'SVE', metrics: [] }),
  loadKnowledge: async () => ({}),
  trendCache: {},
}

export function MockDataProvider({ children, overrides = {} }) {
  const value = { ...MOCK_DATA, ...overrides }
  return <MockContext.Provider value={value}>{children}</MockContext.Provider>
}

// Patch useData to use mock context
export function useMockData() {
  return useContext(MockContext)
}
