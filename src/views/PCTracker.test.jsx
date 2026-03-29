import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PCTracker from './PCTracker'

describe('PCTracker', () => {
  it('renders the page title', () => {
    render(<MemoryRouter><PCTracker /></MemoryRouter>)
    expect(screen.getByText('PC Tracker')).toBeInTheDocument()
  })

  it('renders all PC cards', () => {
    render(<MemoryRouter><PCTracker /></MemoryRouter>)
    expect(screen.getByText('Leakage (3-year avg)')).toBeInTheDocument()
    expect(screen.getByText('Supply Interruptions')).toBeInTheDocument()
    expect(screen.getByText('Pollution Incidents')).toBeInTheDocument()
    expect(screen.getByText('Internal Sewer Flooding')).toBeInTheDocument()
    expect(screen.getByText('Per Capita Consumption')).toBeInTheDocument()
    expect(screen.getByText('Compliance Risk Index')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    render(<MemoryRouter><PCTracker /></MemoryRouter>)
    // At least one badge should be present
    const badges = screen.getAllByText(/On track|At risk|Outperforming|Off track/)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows target values for each PC', () => {
    render(<MemoryRouter><PCTracker /></MemoryRouter>)
    // Each card should show a 2029-30 target
    const targets = screen.getAllByText(/2029-30 target/)
    expect(targets.length).toBe(6)
  })
})
