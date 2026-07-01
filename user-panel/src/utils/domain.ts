import type { DomainConfig } from '../types'

// Applies per-tenant branding, mirroring ApiService.init(): set the favicon to the
// domain logo and the document title to the domain name (falling back to a name
// derived from the host, exactly as Angular did).
export function applyDomain(domain?: DomainConfig | null): void {
  if (domain?.logo) setFavicon(domain.logo)
  const name = domain?.name || deriveBrandFromHost()
  if (name) document.title = name
}

function setFavicon(href: string): void {
  let link =
    document.querySelector<HTMLLinkElement>('link#favicon') ??
    document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.id = 'favicon'
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function deriveBrandFromHost(): string {
  return location.hostname.replace('www.', '').split('.')[0]
}
