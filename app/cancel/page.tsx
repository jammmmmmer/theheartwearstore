'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

export default function CancelPage() {
  const { tr } = useTranslation()

  return (
    <div style={{ background: 'var(--hw-black)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', border: '1px solid var(--hw-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', stroke: 'var(--hw-muted)' }} fill="none" strokeWidth="1.5">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', color: 'var(--hw-white)', marginBottom: '16px' }}>
          {tr.cancel_heading}
        </h1>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--hw-muted)', marginBottom: '32px' }}>
          {tr.cancel_body}
        </p>

        <div style={{ border: '1px solid var(--hw-border)', padding: '20px 28px', marginBottom: '36px' }}>
          <p style={{ fontFamily: 'var(--font-dm-serif)', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--hw-light)', lineHeight: 1.6 }}>
            {tr.cancel_quote}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary">{tr.cancel_shop}</Link>
          <Link href="/" className="btn-outline">{tr.cancel_home}</Link>
        </div>
      </div>
    </div>
  )
}
