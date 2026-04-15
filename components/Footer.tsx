'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'
import { HeartA } from '@/components/Logo'

export default function Footer() {
  const { tr } = useTranslation()
  const year = new Date().getFullYear()

  const cols = [
    {
      heading: tr.footer_explore,
      links: [
        { href: '/shop',    label: tr.nav_shop },
        { href: '/about',   label: tr.nav_about },
        { href: '/contact', label: tr.footer_contact },
      ],
    },
    {
      heading: tr.footer_legal,
      links: [
        { href: '/privacy', label: tr.footer_privacy },
        { href: '/terms',   label: tr.footer_terms },
      ],
    },
  ]

  return (
    <footer
      className="border-t"
      style={{ background: 'var(--hw-off)', borderColor: 'var(--hw-border)', color: 'var(--hw-muted)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '1.25rem',
                color: 'var(--hw-white)',
                letterSpacing: '0.01em',
              }}
            >
              The He<HeartA />rtwear Store
            </span>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', maxWidth: '260px', color: 'var(--hw-muted)' }}>
              {tr.footer_tagline}
            </p>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading} className="flex flex-col gap-4">
              <h3
                style={{
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--hw-mid)',
                  marginBottom: '4px',
                }}
              >
                {col.heading}
              </h3>
              {col.links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--hw-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--hw-white)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--hw-muted)')}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: 'var(--hw-border)' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.1em',
              color: 'var(--hw-muted)',
            }}
          >
            © {year} {tr.footer_copyright}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.1em',
              color: 'var(--hw-border)',
            }}
          >
            {tr.footer_canada}
          </p>
        </div>
      </div>
    </footer>
  )
}
