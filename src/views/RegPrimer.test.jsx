import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegPrimer from './RegPrimer'

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  )
})

describe('RegPrimer', () => {
  it('renders the page title', () => {
    render(<MemoryRouter><RegPrimer /></MemoryRouter>)
    expect(screen.getByText('Regulatory Primer')).toBeInTheDocument()
  })

  it('renders the AMP timeline section', () => {
    render(<MemoryRouter><RegPrimer /></MemoryRouter>)
    expect(screen.getByText('The AMP cycle')).toBeInTheDocument()
    expect(screen.getAllByText(/AMP8/).length).toBeGreaterThan(0)
  })

  it('renders the flow diagram section', () => {
    render(<MemoryRouter><RegPrimer /></MemoryRouter>)
    expect(screen.getByText('How a water company makes money')).toBeInTheDocument()
  })

  it('renders the ODI explainer section', () => {
    render(<MemoryRouter><RegPrimer /></MemoryRouter>)
    expect(screen.getByText('How ODIs work')).toBeInTheDocument()
  })

  it('links to glossary', () => {
    render(<MemoryRouter><RegPrimer /></MemoryRouter>)
    const links = screen.getAllByText(/See full glossary/)
    expect(links.length).toBeGreaterThan(0)
  })
})
