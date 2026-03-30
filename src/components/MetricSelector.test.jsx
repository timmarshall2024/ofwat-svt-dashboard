import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock the useMetricData hook
const mockMetrics = [
  { id: 1, name: 'Modelled base costs water', reference: 'CA01', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 2, name: 'Leakage (Ml/d)', reference: 'PC01', unit: 'Ml/d', taxonomy_domain: '2. Performance Commitments', is_svt_priority: true },
  { id: 3, name: 'C-MeX score', reference: 'ODI01', unit: '%', taxonomy_domain: '3. Outcomes & ODIs', is_svt_priority: true },
  { id: 4, name: 'Allowed totex AMP8', reference: 'CA02', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 5, name: 'Supply interruptions', reference: 'PC02', unit: 'mins', taxonomy_domain: '2. Performance Commitments', is_svt_priority: true },
  { id: 6, name: 'Bill profile for 2025-30 before inflation', reference: 'CA03', unit: '£', taxonomy_domain: '1. Cost Assessment', is_svt_priority: true },
  { id: 7, name: 'Average household bill 2025-26', reference: 'CA04', unit: '£', taxonomy_domain: '4. Price Determination', is_svt_priority: true },
  { id: 100, name: 'Obscure cost metric A', reference: 'CA_OBS1', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
  { id: 101, name: 'Obscure cost metric B', reference: 'CA_OBS2', unit: '%', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
  { id: 102, name: 'Enhancement expenditure water', reference: 'CA_ENH1', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
  { id: 200, name: 'Non-priority ODI metric', reference: 'ODI_NP', unit: 'nr', taxonomy_domain: '3. Outcomes & ODIs', is_svt_priority: false },
  { id: 300, name: 'Financial ratio metric', reference: 'FR01', unit: 'ratio', taxonomy_domain: '5. Financial Resilience', is_svt_priority: false },
  { id: 301, name: 'Allowed return on equity', reference: 'FR02', unit: '%', taxonomy_domain: '5. Financial Resilience', is_svt_priority: false },
  { id: 302, name: 'Gearing ratio', reference: 'FR03', unit: '%', taxonomy_domain: '5. Financial Resilience', is_svt_priority: false },
]

vi.mock('../hooks/useMetricData', () => ({
  useMetricData: () => ({
    metrics: mockMetrics,
  }),
}))

import MetricSelector, { findDefaultMetric } from './MetricSelector'

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

  // ── Problem 1: Domain defaults ──

  it('renders with domain filter and metric dropdown', () => {
    renderSelector()
    expect(screen.getByDisplayValue(/Priority metrics/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Type to search/)).toBeInTheDocument()
  })

  it('default domain is "Priority metrics" — never overridden on mount', () => {
    renderSelector()
    expect(screen.getByDisplayValue(/Priority metrics/)).toBeInTheDocument()
    // MetricSelector must NOT call onChange on mount — parent owns default
    expect(onChange).not.toHaveBeenCalled()
  })

  it('domain stays "Priority metrics" when parent sets a priority metric', () => {
    const { rerender } = renderSelector({ value: null })
    // Parent auto-selects a priority metric (simulating what Benchmarking does)
    rerender(<MetricSelector value={7} onChange={onChange} />)
    // Metric 7 (Average household bill) is priority — domain must stay __priority__
    expect(screen.getByDisplayValue(/Priority metrics/)).toBeInTheDocument()
  })

  it('opening dropdown shows only priority metrics by default', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText('Modelled base costs water')).toBeInTheDocument()
    expect(screen.getByText('Leakage (Ml/d)')).toBeInTheDocument()
    expect(screen.getByText('C-MeX score')).toBeInTheDocument()
    expect(screen.queryByText('Obscure cost metric A')).not.toBeInTheDocument()
    expect(screen.queryByText('Non-priority ODI metric')).not.toBeInTheDocument()
  })

  it('priority metrics are grouped by domain', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    const caHeaders = screen.getAllByText('Cost assessment')
    expect(caHeaders.length).toBeGreaterThanOrEqual(2)
    const pcHeaders = screen.getAllByText('Performance commitments')
    expect(pcHeaders.length).toBeGreaterThanOrEqual(2)
  })

  it('each option shows unit in muted text', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    const unitEls = screen.getAllByText('£m')
    expect(unitEls.length).toBeGreaterThan(0)
    expect(screen.getByText('Ml/d')).toBeInTheDocument()
  })

  // ── Problem 2: Domain change populates dropdown ──

  it('selecting a domain shows only metrics from that domain', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText('Obscure cost metric A')).toBeInTheDocument()
    expect(screen.getByText('Obscure cost metric B')).toBeInTheDocument()
    expect(screen.queryByText('Leakage (Ml/d)')).not.toBeInTheDocument()
    expect(screen.queryByText('Non-priority ODI metric')).not.toBeInTheDocument()
  })

  it('domain change auto-selects first metric and calls onChange', () => {
    renderSelector()
    onChange.mockClear()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    expect(onChange).toHaveBeenCalled()
    const selectedId = onChange.mock.calls[0][0]
    const metric = mockMetrics.find(m => m.id === selectedId)
    expect(metric.taxonomy_domain).toBe('1. Cost Assessment')
  })

  it('selecting "All domains" shows all metrics and warning label', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '__all__' } })
    expect(screen.getByText(/Showing all .* metrics/)).toBeInTheDocument()
  })

  // ── Search filtering ──

  it('typing in metric dropdown filters options', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Leakage' } })
    expect(screen.getByText('Leakage (Ml/d)')).toBeInTheDocument()
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

  // ── External value / route sync ──

  it('pre-selected priority metric keeps domain at Priority metrics', () => {
    renderSelector({ value: 2 })
    expect(screen.getByDisplayValue(/Priority metrics/)).toBeInTheDocument()
  })

  it('pre-selected non-priority metric switches domain to correct domain', () => {
    renderSelector({ value: 300 })
    expect(screen.getByDisplayValue('Financial resilience')).toBeInTheDocument()
  })

  it('selected metric name shown as placeholder in search input', () => {
    renderSelector({ value: 2 })
    expect(screen.getByPlaceholderText('Leakage (Ml/d)')).toBeInTheDocument()
  })

  // ── Problem 3: Recommended metrics ──

  it('shows "Recommended" group when a specific domain is selected', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText(/Recommended/)).toBeInTheDocument()
  })

  it('recommended group contains matching metrics with green dot', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText('Allowed totex AMP8')).toBeInTheDocument()
    expect(screen.getByText('Modelled base costs water')).toBeInTheDocument()
    expect(screen.getByText('Enhancement expenditure water')).toBeInTheDocument()
  })

  it('shows "All metrics" group below recommended', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText(/All metrics/)).toBeInTheDocument()
    expect(screen.getByText('Obscure cost metric A')).toBeInTheDocument()
  })

  it('recommended group hidden when searching', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Obscure' } })
    expect(screen.queryByText(/Recommended/)).not.toBeInTheDocument()
  })

  it('no recommended group for __priority__ or __all__ domains', () => {
    renderSelector()
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.queryByText(/Recommended/)).not.toBeInTheDocument()

    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '__all__' } })
    fireEvent.focus(input)
    expect(screen.queryByText(/Recommended/)).not.toBeInTheDocument()
  })

  it('Financial Resilience domain shows recommended metrics', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue(/Priority metrics/)
    fireEvent.change(domainSelect, { target: { value: '5. Financial Resilience' } })
    const input = screen.getByPlaceholderText(/Type to search/)
    fireEvent.focus(input)
    expect(screen.getByText(/Recommended/)).toBeInTheDocument()
    expect(screen.getByText('Allowed return on equity')).toBeInTheDocument()
    expect(screen.getByText('Gearing ratio')).toBeInTheDocument()
  })

  // ── Exported helper ──

  it('findDefaultMetric returns first matching priority metric', () => {
    const id = findDefaultMetric(mockMetrics)
    expect(id).toBe(7) // "Average household bill 2025-26"
  })

  it('findDefaultMetric falls back to first priority alphabetically', () => {
    const noHouseholdBill = mockMetrics.filter(m => !m.name.toLowerCase().includes('household bill') && !m.name.toLowerCase().includes('bill profile'))
    const id = findDefaultMetric(noHouseholdBill)
    expect(id).not.toBeNull()
    const metric = mockMetrics.find(m => m.id === id)
    expect(metric.is_svt_priority).toBe(true)
  })
})
