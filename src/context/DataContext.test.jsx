import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DataProvider, useData } from './DataContext'

function TestConsumer() {
  const { metrics, loading, error, appointees } = useData()
  if (loading) return <div>Loading</div>
  if (error) return <div>Error: {error}</div>
  return (
    <div>
      <div data-testid="metric-count">{metrics?.length ?? 0}</div>
      <div data-testid="appointee-count">{appointees?.length ?? 0}</div>
    </div>
  )
}

const mockMetrics = [
  { id: 1, name: 'Test metric' },
  { id: 2, name: 'Another metric' },
]

const mockCompanies = [
  { code: 'SVT', company_type: 'WaSC' },
  { code: 'NES', company_type: 'WaSC' },
  { code: 'HDD', company_type: 'NAV' },
]

describe('DataContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('useData throws outside provider', () => {
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useData must be inside DataProvider')
  })

  it('loads and provides metrics and companies', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url.includes('metrics.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockMetrics) })
      }
      if (url.includes('companies.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompanies) })
      }
      if (url.includes('priority_metrics.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      // Other fetches return null-safe
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) })
    })

    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('metric-count')).toHaveTextContent('2')
    })

    // appointees filters out NAV
    expect(screen.getByTestId('appointee-count')).toHaveTextContent('2')
  })

  it('shows error when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (url.includes('metrics.json')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      // companies etc still need to resolve for loading to finish
      if (url.includes('companies.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      if (url.includes('priority_metrics.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) })
    })

    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })
  })
})
