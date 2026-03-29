import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock the useMetricData hook
const mockMetrics = [
  { id: 1, name: 'Modelled base costs water', reference: 'CA01', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 2, name: 'Leakage (Ml/d)', reference: 'PC01', unit: 'Ml/d', taxonomy_domain: '2. Performance Commitments', is_svt_priority: true },
  { id: 3, name: 'C-MeX score', reference: 'ODI01', unit: '%', taxonomy_domain: '3. Outcomes & ODIs', is_svt_priority: true },
  { id: 4, name: 'Allowed totex AMP8', reference: 'CA02', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 5, name: 'Supply interruptions', reference: 'PC02', unit: 'mins', taxonomy_domain: '2. Performance Commitments', is_svt_priority: true },
  { id: 6, name: 'Bill profile for 2025-30 before inflation', reference: 'CA03', unit: '£', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 100, name: 'Obscure cost metric A', reference: 'CA_OBS1', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
  { id: 101, name: 'Obscure cost metric B', reference: 'CA_OBS2', unit: '%', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
  { id: 200, name: 'Non-priority ODI metric', reference: 'ODI_NP', unit: 'nr', taxonomy_domain: '3. Outcomes & ODIs', is_svt_priority: false },
  { id: 300, name: 'Financial ratio metric', reference: 'FR01', unit: 'ratio', taxonomy_domain: '5. Financial Resilience', is_svt_priority: false },
]

vi.mock('../hooks/useMetricData', () => ({
  useMetricData: () => ({
    metrics: mockMetrics,
    metricMap: Object.fromEntries(mockMetrics.map(m => [m.id, m])),
    domains: [...new Set(mockMetrics.map(m => m.taxonomy_domain))].sort(),
    units: [...new Set(mockMetrics.map(m => m.unit))].sort(),
    searchMetrics: (query, opts = {}) => {
      let filtered = mockMetrics
      if (opts.priorityOnly) filtered = filtered.filter(m => m.is_svt_priority)
      if (opts.domain) filtered = filtered.filter(m => m.taxonomy_domain === opts.domain)
      if (query) {
        const q = query.toLowerCase()
        filtered = filtered.filter(m => m.name.toLowerCase().includes(q) || (m.reference || '').toLowerCase().includes(q))
      }
      return filtered
    },
  }),
}))

import MetricSelector from './MetricSelector'

describe('MetricSelector', () => {
  const onChange = vi.fn()

  beforeEach(() => {
    onChange.mockClear()
  })

  function renderSelector(props = {}) {
    return render(
      <MetricSelector
        value={null}
        onChange={onChange}
        {...props}
      />
    )
  }

  it('renders with domain filter and metric dropdown', () => {
    renderSelector()
    // Domain select should be present
    const select = screen.getByDisplayValue(/Priority metrics/)
    expect(select).toBeInTheDocument()
    // Search input should be present
    expect(screen.getByPlaceholderText(/Type to search/)).toBeInTheDocument()
  })

  it('default state shows "Priority metrics" domain', () => {
    renderSelector()
    const select = screen.getByDisplayValue(/Priority metrics/)
    expect(select).toBeInTheDocument()
  })

  it('opening dropdown shows only priority metrics by default', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    // Priority metrics should be visible
    expect(screen.getByText('Modelled base costs water')).toBeInTheDocument()
    expect(screen.getByText('Leakage (Ml/d)')).toBeInTheDocument()
    expect(screen.getByText('C-MeX score')).toBeInTheDocument()
    // Non-priority metrics should NOT be visible
    expect(screen.queryByText('Obscure cost metric A')).not.toBeInTheDocument()
    expect(screen.queryByText('Non-priority ODI metric')).not.toBeInTheDocument()
  })

  it('priority metrics are grouped by domain', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    // Domain group headers appear (also in select options, so use getAllByText)
    const caHeaders = screen.getAllByText('Cost assessment')
    expect(caHeaders.length).toBeGreaterThanOrEqual(2) // select option + group header
    const pcHeaders = screen.getAllByText('Performance commitments')
    expect(pcHeaders.length).toBeGreaterThanOrEqual(2)
  })

  it('each option shows unit in muted text', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    // Multiple metrics may share the same unit
    const unitEls = screen.getAllByText('£m')
    expect(unitEls.length).toBeGreaterThan(0)
    expect(screen.getByText('Ml/d')).toBeInTheDocument()
  })

  it('selecting a domain shows only metrics from that domain', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    // Should show cost assessment metrics including non-priority
    expect(screen.getByText('Obscure cost metric A')).toBeInTheDocument()
    expect(screen.getByText('Obscure cost metric B')).toBeInTheDocument()
    // Should NOT show other domain metrics
    expect(screen.queryByText('Leakage (Ml/d)')).not.toBeInTheDocument()
    expect(screen.queryByText('Non-priority ODI metric')).not.toBeInTheDocument()
  })

  it('selecting "All domains" shows all metrics and warning label', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '__all__' } })
    // Warning text should appear
    expect(screen.getByText(/Showing all .* metrics/)).toBeInTheDocument()
  })

  it('typing in metric dropdown filters options', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Leakage' } })
    expect(screen.getByText('Leakage (Ml/d)')).toBeInTheDocument()
    // Others should be filtered out
    expect(screen.queryByText('C-MeX score')).not.toBeInTheDocument()
  })

  it('shows "No results" when search has no matches', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'xyznonexistent' } })
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('onChange fires with correct metric_id when option selected', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    fireEvent.click(screen.getByText('Leakage (Ml/d)'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('pre-selected metric sets domain correctly for priority metric', () => {
    renderSelector({ value: 2 })
    // Metric 2 is priority, so domain should stay on "Priority metrics"
    expect(screen.getByDisplayValue(/Priority metrics/)).toBeInTheDocument()
  })

  it('pre-selected non-priority metric switches domain to correct domain', () => {
    renderSelector({ value: 300 })
    // Metric 300 is in Financial Resilience, not priority
    // Domain should auto-switch — displayed text is "Financial resilience"
    expect(screen.getByDisplayValue('Financial resilience')).toBeInTheDocument()
  })

  it('selected metric name shown as placeholder in search input', () => {
    renderSelector({ value: 2 })
    expect(screen.getByPlaceholderText('Leakage (Ml/d)')).toBeInTheDocument()
  })
})
