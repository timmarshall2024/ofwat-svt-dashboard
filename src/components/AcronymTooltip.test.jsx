import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AcronymTooltip, { AcronymText } from './AcronymTooltip'
import { ACRONYMS } from '../utils/acronyms'

describe('AcronymTooltip', () => {
  it('renders full name on first occurrence', () => {
    render(<AcronymTooltip text="RCV" firstOccurrence={true} />)
    expect(screen.getByText('RCV')).toBeInTheDocument()
    expect(screen.getByText(/Regulatory Capital Value/)).toBeInTheDocument()
  })

  it('renders just acronym with tooltip on subsequent occurrence', () => {
    render(<AcronymTooltip text="RCV" firstOccurrence={false} />)
    const triggers = screen.getAllByText('RCV')
    expect(triggers.length).toBeGreaterThanOrEqual(1)
    // Tooltip text is in the DOM but hidden via CSS
    expect(screen.getByRole('tooltip')).toHaveTextContent('Regulatory Capital Value')
  })

  it('tooltip text matches ACRONYMS dictionary', () => {
    render(<AcronymTooltip text="WACC" firstOccurrence={false} />)
    expect(screen.getByRole('tooltip')).toHaveTextContent(ACRONYMS['WACC'])
  })

  it('renders plain text for unknown acronym', () => {
    render(<AcronymTooltip text="XYZ" />)
    expect(screen.getByText('XYZ')).toBeInTheDocument()
  })
})

describe('AcronymText', () => {
  it('wraps known acronyms in text', () => {
    const tracker = {
      hasBeenSeen: () => false,
      markAsSeen: () => {},
    }
    render(<AcronymText tracker={tracker}>The WACC is 4.03%</AcronymText>)
    expect(screen.getByText(/Weighted Average Cost of Capital/)).toBeInTheDocument()
  })

  it('returns non-string children unchanged', () => {
    const tracker = { hasBeenSeen: () => false, markAsSeen: () => {} }
    const node = <span>hello</span>
    render(<AcronymText tracker={tracker}>{node}</AcronymText>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
