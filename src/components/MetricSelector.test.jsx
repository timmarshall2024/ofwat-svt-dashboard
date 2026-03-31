import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetricSelector, { findDefaultMetric, getPriorityMetrics, searchMetrics, displayName } from './MetricSelector'

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
  const onModeChange = vi.fn()
  const onMetricChange = vi.fn()
  const onSearchChange = vi.fn()

  beforeEach(() => {
    onModeChange.mockClear()
    onMetricChange.mockClear()
    onSearchChange.mockClear()
  })

  function renderSelector(props = {}) {
    return render(
      <MetricSelector
        metrics={mockMetrics}
        mode="__priority__"
        onModeChange={onModeChange}
        selectedMetricId={null}
        onMetricChange={onMetricChange}
        searchQuery=""
        onSearchChange={onSearchChange}
        {...props}
      />
    )
  }

  // ── Priority mode ──

  it('renders with mode select showing Priority metrics', () => {
    renderSelector()
    expect(screen.getByDisplayValue('Priority metrics')).toBeInTheDocument()
  })

  it('does not call callbacks on mount', () => {
    renderSelector()
    expect(onModeChange).not.toHaveBeenCalled()
    expect(onMetricChange).not.toHaveBeenCalled()
  })

  it('priority mode shows only priority metrics in dropdown', () => {
    renderSelector()
    const metricSelect = screen.getAllByRole('combobox')[1]
    const options = Array.from(metricSelect.querySelectorAll('option')).filter(o => !o.disabled)
    const names = options.map(o => o.textContent)
    expect(names).toContain('Modelled base costs water (£m)')
    expect(names).not.toContain('Obscure cost metric A (£m)')
    expect(names).not.toContain('Non-priority ODI metric (nr)')
    expect(names).not.toContain('Financial ratio metric (ratio)')
  })

  it('selecting a mode calls onModeChange', () => {
    renderSelector()
    const modeSelect = screen.getByDisplayValue('Priority metrics')
    fireEvent.change(modeSelect, { target: { value: '__search__' } })
    expect(onModeChange).toHaveBeenCalledWith('__search__')
  })

  it('selecting a metric calls onMetricChange with the id', () => {
    renderSelector()
    const metricSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(metricSelect, { target: { value: '2' } })
    expect(onMetricChange).toHaveBeenCalledWith(2)
  })

  it('pre-selected metric is shown as selected in dropdown', () => {
    renderSelector({ selectedMetricId: 2 })
    const metricSelect = screen.getAllByRole('combobox')[1]
    expect(metricSelect.value).toBe('2')
  })

  // ── Search mode ──

  it('search mode shows text input instead of metric dropdown', () => {
    renderSelector({ mode: '__search__' })
    expect(screen.getByPlaceholderText(/Search all/)).toBeInTheDocument()
    // Should not have a second combobox
    expect(screen.getAllByRole('combobox').length).toBe(1)
  })

  it('search input calls onSearchChange', () => {
    renderSelector({ mode: '__search__' })
    const input = screen.getByPlaceholderText(/Search all/)
    fireEvent.change(input, { target: { value: 'leakage' } })
    expect(onSearchChange).toHaveBeenCalledWith('leakage')
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

  it('getPriorityMetrics returns only priority metrics', () => {
    const result = getPriorityMetrics(mockMetrics)
    expect(result.every(m => m.is_svt_priority)).toBe(true)
    expect(result.length).toBe(7)
  })

  it('searchMetrics returns relevant results', () => {
    const results = searchMetrics(mockMetrics, 'leakage')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toBe('Leakage (Ml/d)')
  })

  it('searchMetrics prioritises priority metrics', () => {
    const results = searchMetrics(mockMetrics, 'cost')
    const firstPriorityIdx = results.findIndex(m => m.is_svt_priority)
    const firstNonPriorityIdx = results.findIndex(m => !m.is_svt_priority)
    if (firstPriorityIdx >= 0 && firstNonPriorityIdx >= 0) {
      expect(firstPriorityIdx).toBeLessThan(firstNonPriorityIdx)
    }
  })

  it('searchMetrics returns empty for short queries', () => {
    expect(searchMetrics(mockMetrics, 'a')).toEqual([])
    expect(searchMetrics(mockMetrics, '')).toEqual([])
  })

  it('searchMetrics caps results at 20', () => {
    // Create a large array
    const many = Array.from({ length: 100 }, (_, i) => ({
      id: 10000 + i, name: `Test metric ${i}`, reference: `T${i}`, unit: 'nr', is_svt_priority: false
    }))
    const results = searchMetrics(many, 'test metric')
    expect(results.length).toBe(20)
  })
})
