import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MetricRow from './MetricRow'

const baseMetric = {
  metric_id: 9865,
  canonical_name: 'Leakage',
  unit: 'Ml/d',
  svt_value: 289.7,
  sector_median: 150,
  why_it_matters: 'Lower leakage reduces water waste',
  svt_period: '2029-30',
}

function renderRow(metric, props = {}) {
  return render(
    <MemoryRouter>
      <MetricRow metric={metric} {...props} />
    </MemoryRouter>
  )
}

describe('MetricRow', () => {
  it('renders metric name, value and unit', () => {
    renderRow(baseMetric)
    expect(screen.getByText('Leakage')).toBeInTheDocument()
    expect(screen.getByText('289.7 Ml/d')).toBeInTheDocument()
    expect(screen.getByText('Ml/d')).toBeInTheDocument()
  })

  it('renders sector median with direction indicator', () => {
    renderRow(baseMetric)
    expect(screen.getByText(/Sector:.*150\.0 Ml\/d/)).toBeInTheDocument()
    expect(screen.getByText('\u25B2')).toBeInTheDocument()
  })

  it('info icon click triggers onInfoClick', () => {
    const handler = vi.fn()
    renderRow(baseMetric, { onInfoClick: handler })
    const btn = screen.getByLabelText('More info')
    fireEvent.click(btn)
    expect(handler).toHaveBeenCalledWith(baseMetric)
  })

  it('renders description text', () => {
    renderRow(baseMetric)
    expect(screen.getByText('Lower leakage reduces water waste')).toBeInTheDocument()
  })

  it('shows secondary value when present', () => {
    const dualMetric = {
      ...baseMetric,
      canonical_name: 'Opening RCV at 1 April 2025',
      unit: '£m',
      svt_value: 13518,
      svt_value_secondary: 12258.69,
      svt_value_secondary_label: 'PR24 FD model (pre-adjustments)',
      svt_value_label: 'Post-indexation & true-ups',
      rcv_difference_explanation: 'The difference reflects CPIH indexation.',
    }
    renderRow(dualMetric)
    expect(screen.getByText('Post-indexation & true-ups')).toBeInTheDocument()
    expect(screen.getByText(/PR24 FD model/)).toBeInTheDocument()
    expect(screen.getByText(/£12.26bn/)).toBeInTheDocument()
  })

  it('displays the period label', () => {
    renderRow(baseMetric)
    expect(screen.getByText('2029-30')).toBeInTheDocument()
  })

  it('shows AMP8 total for totex metrics', () => {
    const totexMetric = {
      ...baseMetric,
      canonical_name: 'Allowed totex — Water',
      svt_period: '2025-30',
    }
    renderRow(totexMetric)
    expect(screen.getByText('AMP8 total (2025-30)')).toBeInTheDocument()
  })

  it('shows PR24 FD when no period', () => {
    const noPeriod = { ...baseMetric, svt_period: null }
    renderRow(noPeriod)
    expect(screen.getByText('PR24 FD')).toBeInTheDocument()
  })
})
