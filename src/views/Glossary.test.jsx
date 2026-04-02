import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Glossary from './Glossary'

// Mock fetch to return knowledge data
const mockKnowledgeIndex = {
  documents: [
    { file: 'svt-overview.json' },
    { file: 'aligning-risk-and-return.json' },
  ],
}

const mockSvtOverview = {
  document_title: 'SVT Overview',
  glossary_terms: [
    { term: 'AMP8', definition: 'Asset Management Period 8' },
    { term: 'ODI', definition: 'Outcome Delivery Incentive' },
  ],
}

const mockRiskReturn = {
  document_title: 'Risk and Return',
  glossary_terms: [
    { term: 'WACC', definition: 'Weighted Average Cost of Capital' },
    { term: 'CAPM', definition: 'Capital Asset Pricing Model' },
  ],
}

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('index.json')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockKnowledgeIndex) })
    }
    if (url.includes('svt-overview')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSvtOverview) })
    }
    if (url.includes('aligning-risk-and-return')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRiskReturn) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
})

describe('Glossary', () => {
  it('renders the page title', async () => {
    render(<MemoryRouter><Glossary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('Glossary')).toBeInTheDocument())
  })

  it('renders glossary terms after loading', async () => {
    render(<MemoryRouter><Glossary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('AMP8')).toBeInTheDocument())
    expect(screen.getByText('WACC')).toBeInTheDocument()
    expect(screen.getByText('CAPM')).toBeInTheDocument()
    expect(screen.getByText('ODI')).toBeInTheDocument()
  })

  it('search filters terms correctly', async () => {
    render(<MemoryRouter><Glossary /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('AMP8')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText(/Search terms/)
    fireEvent.change(searchInput, { target: { value: 'WACC' } })

    expect(screen.getByText('WACC')).toBeInTheDocument()
    expect(screen.queryByText('AMP8')).not.toBeInTheDocument()
  })

  it('shows term count', async () => {
    render(<MemoryRouter><Glossary /></MemoryRouter>)
    // 4 knowledge terms + ACRONYMS dict (minus duplicates)
    await waitFor(() => expect(screen.getByText(/\d+ regulatory terms/)).toBeInTheDocument())
  })
})
