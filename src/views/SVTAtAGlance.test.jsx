import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/DataContext', () => ({
  useData: () => ({
    priorityMetrics: [
      {
        metric_id: 1,
        canonical_name: 'Total annual leakage',
        taxonomy_domain: '1. Cost Assessment',
        unit: 'Ml/d',
        svt_value: 289.7,
        sector_median: 150,
        latest_period: '2029-30',
      },
    ],
    loading: false,
    loadKnowledge: vi.fn(),
    knowledgeIndex: null,
  }),
}))

import SVTAtAGlance from './SVTAtAGlance'

describe('SVTAtAGlance', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <SVTAtAGlance />
      </MemoryRouter>
    )
    expect(screen.getByText('SVT at a Glance')).toBeInTheDocument()
  })

  it('renders headline stats', () => {
    render(
      <MemoryRouter>
        <SVTAtAGlance />
      </MemoryRouter>
    )
    expect(screen.getByText('4.03%')).toBeInTheDocument()
  })

  it('renders assessment banner', () => {
    render(
      <MemoryRouter>
        <SVTAtAGlance />
      </MemoryRouter>
    )
    expect(screen.getByText('Outstanding')).toBeInTheDocument()
    expect(screen.getByText(/not referred to CMA/)).toBeInTheDocument()
  })

  it('renders domain groups', () => {
    render(
      <MemoryRouter>
        <SVTAtAGlance />
      </MemoryRouter>
    )
    expect(screen.getByText('Cost Assessment')).toBeInTheDocument()
  })
})
