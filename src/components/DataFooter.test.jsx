import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataFooter from './DataFooter'

describe('DataFooter', () => {
  it('renders attribution text', () => {
    render(<DataFooter />)
    expect(screen.getByText(/Fox Stephens/)).toBeInTheDocument()
    expect(screen.getByText(/Ofwat PR24/)).toBeInTheDocument()
  })

  it('renders as a footer element', () => {
    const { container } = render(<DataFooter />)
    expect(container.querySelector('footer')).toBeInTheDocument()
  })
})
