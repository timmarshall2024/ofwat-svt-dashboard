import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import usePageTitle from './usePageTitle'

describe('usePageTitle', () => {
  afterEach(() => {
    document.title = ''
  })

  it('sets document title with suffix', () => {
    renderHook(() => usePageTitle('Benchmarking'))
    expect(document.title).toBe('Benchmarking | Ofwat Regulatory Intelligence')
  })

  it('resets title on unmount', () => {
    const { unmount } = renderHook(() => usePageTitle('Trends'))
    expect(document.title).toBe('Trends | Ofwat Regulatory Intelligence')
    unmount()
    expect(document.title).toBe('Ofwat Regulatory Intelligence')
  })

  it('updates when title prop changes', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: 'Page A' },
    })
    expect(document.title).toBe('Page A | Ofwat Regulatory Intelligence')
    rerender({ title: 'Page B' })
    expect(document.title).toBe('Page B | Ofwat Regulatory Intelligence')
  })
})
