import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetricRow from './MetricRow'

const baseMetric = {
  metric_id: 9865,
  canonical_name: 'Leakage',
  unit: 'Ml/d',
  svt_value: 289.7,
  sector_median: 150,
  why_it_matters: 'Lower leakage reduces water waste',
}

describe('MetricRow', () => {
  it('renders metric name, value and unit', () => {
    render(<MetricRow metric={baseMetric} />)
    expect(screen.getByText('Leakage')).toBeInTheDocument()
    expect(screen.getByText('289.7 Ml/d')).toBeInTheDocument()
    expect(screen.getByText('Ml/d')).toBeInTheDocument()
  })

  it('renders sector median with direction indicator', () => {
    render(<MetricRow metric={baseMetric} />)
    expect(screen.getByText(/Sector:.*150\.0 Ml\/d/)).toBeInTheDocument()
    // SVT above median for leakage → up triangle
    expect(screen.getByText('\u25B2')).toBeInTheDocument()
  })

  it('info icon click triggers onInfoClick', () => {
    const handler = vi.fn()
    render(<MetricRow metric={baseMetric} onInfoClick={handler} />)
    const btn = screen.getByLabelText('More info')
    fireEvent.click(btn)
    expect(handler).toHaveBeenCalledWith(baseMetric)
  })

  it('renders description text', () => {
    render(<MetricRow metric={baseMetric} />)
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
    render(<MetricRow metric={dualMetric} />)
    expect(screen.getByText('Post-indexation & true-ups')).toBeInTheDocument()
    expect(screen.getByText(/PR24 FD model/)).toBeInTheDocument()
    expect(screen.getByText(/£12.26bn/)).toBeInTheDocument()
  })
})
