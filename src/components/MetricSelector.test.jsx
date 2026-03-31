import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetricSelector, { findDefaultMetric, findDefaultForDomain, getMetricsForDomain, displayName } from './MetricSelector'

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

describe('MetricSelector', () => {
  const onDomainChange = vi.fn()
  const onMetricChange = vi.fn()

  beforeEach(() => {
    onDomainChange.mockClear()
    onMetricChange.mockClear()
  })

  function renderSelector(props = {}) {
    return render(
      <MetricSelector
        metrics={mockMetrics}
        selectedDomain="__priority__"
        onDomainChange={onDomainChange}
        selectedMetricId={null}
        onMetricChange={onMetricChange}
        {...props}
      />
    )
  }

  // ── Domain defaults ──

  it('renders with domain select showing Priority metrics', () => {
    renderSelector()
    expect(screen.getByDisplayValue('Priority metrics')).toBeInTheDocument()
  })

  it('does not call onDomainChange or onMetricChange on mount', () => {
    renderSelector()
    expect(onDomainChange).not.toHaveBeenCalled()
    expect(onMetricChange).not.toHaveBeenCalled()
  })

  it('domain stays Priority metrics when parent sets a priority metric', () => {
    const { rerender } = renderSelector({ selectedMetricId: null })
    rerender(
      <MetricSelector
        metrics={mockMetrics}
        selectedDomain="__priority__"
        onDomainChange={onDomainChange}
        selectedMetricId={7}
        onMetricChange={onMetricChange}
      />
    )
    expect(screen.getByDisplayValue('Priority metrics')).toBeInTheDocument()
  })

  it('metric dropdown shows only priority metrics when domain is __priority__', () => {
    renderSelector()
    const metricSelect = screen.getAllByRole('combobox')[1]
    const options = Array.from(metricSelect.querySelectorAll('option')).filter(o => !o.disabled)
    const names = options.map(o => o.textContent)
    expect(names).toContain('Modelled base costs water (£m)')
    expect(names).toContain('Leakage (Ml/d) (Ml/d)')
    expect(names).not.toContain('Obscure cost metric A (£m)')
    expect(names).not.toContain('Non-priority ODI metric (nr)')
  })

  // ── Domain change ──

  it('selecting a domain calls onDomainChange', () => {
    renderSelector()
    const domainSelect = screen.getByDisplayValue('Priority metrics')
    fireEvent.change(domainSelect, { target: { value: '1. Cost Assessment' } })
    expect(onDomainChange).toHaveBeenCalledWith('1. Cost Assessment')
  })

  it('specific domain shows only metrics from that domain', () => {
    renderSelector({ selectedDomain: '1. Cost Assessment' })
    const metricSelect = screen.getAllByRole('combobox')[1]
    const options = Array.from(metricSelect.querySelectorAll('option')).filter(o => !o.disabled)
    const names = options.map(o => o.textContent)
    expect(names).toContain('Obscure cost metric A (£m)')
    expect(names).toContain('Obscure cost metric B (%)')
    expect(names).toContain('Modelled base costs water (£m)')
    expect(names).not.toContain('Leakage (Ml/d) (Ml/d)')
  })

  it('selecting All domains shows all metrics', () => {
    renderSelector({ selectedDomain: '__all__' })
    const metricSelect = screen.getAllByRole('combobox')[1]
    const options = Array.from(metricSelect.querySelectorAll('option')).filter(o => !o.disabled)
    expect(options.length).toBe(mockMetrics.length)
  })

  it('selecting a metric calls onMetricChange with the id', () => {
    renderSelector({ selectedDomain: '__priority__' })
    const metricSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(metricSelect, { target: { value: '2' } })
    expect(onMetricChange).toHaveBeenCalledWith(2)
  })

  it('pre-selected metric is shown as selected in dropdown', () => {
    renderSelector({ selectedMetricId: 2 })
    const metricSelect = screen.getAllByRole('combobox')[1]
    expect(metricSelect.value).toBe('2')
  })

  // ── Exported helpers ──

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

  it('getMetricsForDomain returns priority metrics for __priority__', () => {
    const result = getMetricsForDomain(mockMetrics, '__priority__')
    expect(result.every(m => m.is_svt_priority)).toBe(true)
    expect(result.length).toBe(7)
  })

  it('getMetricsForDomain returns all metrics for __all__', () => {
    const result = getMetricsForDomain(mockMetrics, '__all__')
    expect(result.length).toBe(mockMetrics.length)
  })

  it('getMetricsForDomain returns domain-filtered metrics', () => {
    const result = getMetricsForDomain(mockMetrics, '1. Cost Assessment')
    expect(result.every(m => m.taxonomy_domain === '1. Cost Assessment')).toBe(true)
    expect(result.length).toBe(6) // 3 priority + 3 non-priority CA metrics
  })

  it('findDefaultForDomain picks first metric for a specific domain', () => {
    const id = findDefaultForDomain(mockMetrics, '5. Financial Resilience')
    expect(id).not.toBeNull()
    const metric = mockMetrics.find(m => m.id === id)
    expect(metric.taxonomy_domain).toBe('5. Financial Resilience')
  })
})
