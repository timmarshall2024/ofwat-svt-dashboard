import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from './NavBar'

function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
  )
}

describe('NavBar', () => {
  it('renders all navigation links', () => {
    renderWithRouter(<NavBar />)
    expect(screen.getByText('SVT at a Glance')).toBeInTheDocument()
    expect(screen.getByText('Benchmarking')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    expect(screen.getByText('Metric Explorer')).toBeInTheDocument()
    expect(screen.getByText('SVT vs CMA')).toBeInTheDocument()
  })

  it('renders brand title', () => {
    renderWithRouter(<NavBar />)
    expect(screen.getByText('Ofwat Regulatory Intelligence')).toBeInTheDocument()
  })

  it('renders Fox Stephens logo', () => {
    renderWithRouter(<NavBar />)
    expect(screen.getByAltText('Fox Stephens')).toBeInTheDocument()
  })

  it('highlights active link', () => {
    renderWithRouter(<NavBar />, { route: '/benchmarking' })
    const link = screen.getByText('Benchmarking')
    expect(link).toHaveClass('bg-white/15')
  })
})
