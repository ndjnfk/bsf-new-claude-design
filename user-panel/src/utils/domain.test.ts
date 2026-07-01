import { describe, it, expect, beforeEach } from 'vitest'
import { applyDomain } from './domain'

beforeEach(() => {
  document.title = ''
  document.querySelectorAll('link#favicon').forEach((n) => n.remove())
})

describe('applyDomain', () => {
  it('sets the document title and favicon from the domain config', () => {
    applyDomain({ name: 'BrandX', logo: '/brand.png' })
    expect(document.title).toBe('BrandX')
    expect(document.querySelector('link#favicon')?.getAttribute('href')).toBe('/brand.png')
  })

  it('derives a non-empty title from the host when no domain is given', () => {
    applyDomain(null)
    expect(document.title.length).toBeGreaterThan(0)
  })
})
