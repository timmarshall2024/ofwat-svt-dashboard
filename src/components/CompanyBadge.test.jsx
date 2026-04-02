import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompanyBadge from './CompanyBadge'

describe('CompanyBadge', () => {
  it('renders company label with name and code', () => {
    render(<CompanyBadge code="ANH" />)
    expect(screen.getByText('Anglian (ANH)')).toBeInTheDocument()
  })

  it('applies highlight style for SVT', () => {
    const { container } = render(<CompanyBadge code="SVT" />)
    expect(container.firstChild).toHaveClass('bg-fs-highlight')
  })

  it('applies highlight style for SVE', () => {
    const { container } = render(<CompanyBadge code="SVE" />)
    expect(container.firstChild).toHaveClass('bg-fs-highlight')
  })

  it('applies default style for other companies', () => {
    const { container } = render(<CompanyBadge code="ANH" />)
    expect(container.firstChild).toHaveClass('bg-fs-primary-light')
  })

  it('shows remove button for non-SVT with onRemove', () => {
    const onRemove = vi.fn()
    render(<CompanyBadge code="ANH" onRemove={onRemove} />)
    const btn = screen.getByRole('button', { name: 'Remove Anglian (ANH)' })
    expect(btn).toBeInTheDocument()
  })

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn()
    render(<CompanyBadge code="ANH" onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Anglian (ANH)' }))
    expect(onRemove).toHaveBeenCalledWith('ANH')
  })

  it('does not show remove button for SVT even with onRemove', () => {
    const onRemove = vi.fn()
    render(<CompanyBadge code="SVT" onRemove={onRemove} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not show remove button when onRemove not provided', () => {
    render(<CompanyBadge code="ANH" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
