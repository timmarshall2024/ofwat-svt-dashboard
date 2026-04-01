import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the data hooks and components used by Benchmarking
vi.mock('../context/DataContext', () => ({
  useData: () => ({
    appointees: [
      { code: 'SVT', company_type: 'WaSC' },
      { code: 'ANH', company_type: 'WaSC' },
      { code: 'SES', company_type: 'WoC' },
    ],
    metrics: [
      { id: 10918, name: 'Average household bill 2025-26', reference: 'CA04', unit: '£', taxonomy_domain: '4. Price Determination', is_svt_priority: true },
      { id: 9865, name: 'Leakage (Ml/d)', reference: 'PC01', unit: 'Ml/d', taxonomy_domain: '2. Performance Commitments', is_svt_priority: true },
      { id: 100, name: 'Obscure metric', reference: 'Z99', unit: '£m', taxonomy_domain: '1. Cost Assessment', is_svt_priority: false },
    ],
  }),
}))

vi.mock('../hooks/useBenchmarkData', () => ({
  useBenchmarkData: (id) => {
    if (id === 10918) {
      return {
        data: {
          name: 'Average household bill 2025-26',
          unit: '£',
          taxonomy_domain: '4. Price Determination',
          values: [
            { company: 'SVT', period: '2025-26', value: 463 },
            { company: 'ANH', period: '2025-26', value: 480 },
            { company: 'SES', period: '2025-26', value: 410 },
          ],
        },
        loading: false,
        error: null,
      }
    }
    return { data: null, loading: false, error: null }
  },
}))

vi.mock('../hooks/useKnowledge', () => ({
  useKnowledge: () => ({ data: null, loading: false, error: null }),
}))

// Import after mocks
import Benchmarking from './Benchmarking'

describe('Benchmarking view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page with title and metric selector', () => {
    render(
      <MemoryRouter>
        <Benchmarking />
      </MemoryRouter>
    )
    expect(screen.getByText('Benchmarking')).toBeInTheDocument()
    expect(screen.getByText('Select metric')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Priority metrics')).toBeInTheDocument()
  })

  it('defaults to priority mode with household bill metric', () => {
    render(
      <MemoryRouter>
        <Benchmarking />
      </MemoryRouter>
    )
    // The default metric selection (household bill) should load data
    expect(screen.getAllByText(/Average household bill/).length).toBeGreaterThan(0)
  })

  it('shows company data in the table', () => {
    render(
      <MemoryRouter>
        <Benchmarking />
      </MemoryRouter>
    )
    expect(screen.getByText('SVT')).toBeInTheDocument()
    expect(screen.getByText('ANH')).toBeInTheDocument()
    expect(screen.getByText('SES')).toBeInTheDocument()
  })

  it('highlights SVT row in the data table', () => {
    render(
      <MemoryRouter>
        <Benchmarking />
      </MemoryRouter>
    )
    const svtRow = screen.getByText('SVT').closest('tr')
    expect(svtRow.className).toContain('bg-fs-secondary-light')
  })

  it('shows methodology button', () => {
    render(
      <MemoryRouter>
        <Benchmarking />
      </MemoryRouter>
    )
    expect(screen.getByText('Methodology')).toBeInTheDocument()
  })
})
