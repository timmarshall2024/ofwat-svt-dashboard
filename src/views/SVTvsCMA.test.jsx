import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the DataContext
vi.mock('../context/DataContext', () => ({
  useData: () => ({
    loading: false,
    companies: [],
    metrics: [],
    knowledgeIndex: null,
    loadKnowledge: vi.fn(),
  }),
}))

import SVTvsCMA from './SVTvsCMA'

describe('SVTvsCMA', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getByText('SVT vs CMA Five')).toBeInTheDocument()
  })

  it('renders the context banner', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getByText('Why this matters')).toBeInTheDocument()
  })

  it('renders all comparison categories', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getByText('Customer Bills')).toBeInTheDocument()
    expect(screen.getByText('Financial')).toBeInTheDocument()
    expect(screen.getByText('Operational Performance (2029-30 targets)')).toBeInTheDocument()
    expect(screen.getByText('ODI Incentives')).toBeInTheDocument()
    expect(screen.getByText('Environmental (2029-30)')).toBeInTheDocument()
  })

  it('renders company column headers', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getAllByText('Severn Trent').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Anglian').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Yorkshire').length).toBeGreaterThan(0)
  })

  it('renders scatter chart section', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getByText('Bill Level vs Demand Reduction Ambition')).toBeInTheDocument()
  })

  it('renders key takeaways', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    expect(screen.getByText('Key Takeaways')).toBeInTheDocument()
    expect(screen.getByText(/Uniform WACC/)).toBeInTheDocument()
  })

  it('shows n/a for missing BRL bill data', () => {
    render(
      <MemoryRouter>
        <SVTvsCMA />
      </MemoryRouter>
    )
    // BRL has null bill values, should render as 'n/a'
    const cells = screen.getAllByText('n/a')
    expect(cells.length).toBeGreaterThan(0)
  })
})
