import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Print CSS', () => {
  it('print stylesheet exists and contains @media print', () => {
    const css = readFileSync(resolve(__dirname, 'print.css'), 'utf-8')
    expect(css).toContain('@media print')
  })

  it('print stylesheet hides navigation', () => {
    const css = readFileSync(resolve(__dirname, 'print.css'), 'utf-8')
    expect(css).toContain('nav')
    expect(css).toContain('display: none')
  })

  it('print stylesheet is imported in main.jsx', () => {
    const mainJsx = readFileSync(resolve(__dirname, '..', 'main.jsx'), 'utf-8')
    expect(mainJsx).toContain("import './styles/print.css'")
  })
})
