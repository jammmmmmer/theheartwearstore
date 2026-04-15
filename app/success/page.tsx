'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/cart-store'
import { useTranslation } from '@/lib/language-context'

export default function SuccessPage() {
  const { clearCart } = useCartStore()
  const { tr } = useTranslation()

  useEffect(() => { clearCart() }, [clearCart])

  return (
    <div style={{ background: 'var(--hw-black)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Heart icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <svg viewBox="0 0 60 54" style={{ width: '60px', height: '54px' }} fill="none">
            <path d="M30 52S2 36 2 16.5A14 14 0 0130 10a14 14 0 0128 6.5C58 36 30 52 30 52z" stroke="var(--hw-accent)" strokeWidth="1.5" fill="rgba(201,64,42,0.1)"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,5vw,3rem)', color: 'var(--hw-white)', marginBottom: '16px' }}>
          {tr.success_heading}
        </h1>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--hw-muted)', marginBottom: '40px' }}>
          {tr.success_body}
        </p>

        <div style={{ border: '1px solid var(--hw-border)', padding: '28px 32px', textAlign: 'left', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--hw-muted)', marginBottom: '16px' }}>
            {tr.success_next_eyebrow}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[tr.success_next_1, tr.success_next_2, tr.success_next_3, tr.success_next_4].map((item, i) => (
              <li key={i} style={{ fontSize: '0.85rem', color: 'var(--hw-light)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--hw-accent)', flexShrink: 0 }}>✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary">{tr.success_keep_shopping}</Link>
          <Link href="/" className="btn-outline">{tr.success_home}</Link>
        </div>

        <p style={{ fontFamily: 'var(--font-dm-serif)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--hw-muted)', marginTop: '32px' }}>
          {tr.success_quote}
        </p>
      </div>
    </div>
  )
}
