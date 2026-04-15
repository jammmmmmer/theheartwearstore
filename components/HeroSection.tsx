'use client'

/**
 * HeroSection — Lifestyle Hero Banner
 * ─────────────────────────────────────────────────────────────────────────────
 * SUMMARY OF CHANGES (v2 — Earth Tone Lifestyle Hero)
 *
 *  WHAT CHANGED
 *  • Props added: `latestProduct` (Product|null) + `productCount` (number)
 *    The hero now reflects live store data — no more static placeholder.
 *
 *  • "New Drop" badge: renders when latestProduct exists. Wire-ready for a
 *    date-check (e.g. created within 30 days) without touching JSX.
 *
 *  • Earth Tone palette introduced: clay (--et-clay), sage (--et-sage),
 *    moss (--et-moss), sand (--et-sand). Defined in globals.css / tailwind.
 *
 *  • Product image panel: the latest product's hero image floats right
 *    with a clay glow halo + subtle parallax. Falls back gracefully if
 *    no products exist yet.
 *
 *  • CTA tracking hook: handleShopNow fires a custom DOM event
 *    ('hw:hero_cta_click') — attach GA4 / CRM listeners anywhere without
 *    re-touching this component.
 *
 *  • Live stat bar: shows product count with a pulsing moss dot.
 *
 *  • Canvas water animation retained — brand signature, now with
 *    sage-tinted shimmer and scroll indicator.
 *
 *  WHAT DIDN'T CHANGE
 *  • All existing tr.* translation keys still used (zero i18n breakage).
 *  • Canvas wave logic unchanged — same parallax math.
 *  • Marquee strip kept, now in sage instead of muted grey.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/language-context'
import { Product } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────
interface HeroSectionProps {
  /** Most recently added enabled product — drives image + New Drop badge */
  latestProduct?: Product | null
  /** Total enabled products — shown in the live-stat bar at the bottom */
  productCount?: number
}

// ─── Canvas wave config ───────────────────────────────────────────────────────
const WAVE_LAYERS = [
  { speed: 0.28, amp: 38, freq: 0.008, color: '#1a3040', yOff: 0.55 },
  { speed: 0.18, amp: 28, freq: 0.013, color: '#0d2030', yOff: 0.60 },
  { speed: 0.38, amp: 22, freq: 0.018, color: '#233545', yOff: 0.58 },
  { speed: 0.12, amp: 48, freq: 0.006, color: '#0a1520', yOff: 0.65 },
]

// ─── Marquee items ────────────────────────────────────────────────────────────
const MARQUEE = [
  'Wear Your Heart', 'Print on Demand', 'Made to Order',
  'Natural Clothing', 'Ships to Canada & USA', 'Zero Waste', 'Made with Purpose',
  'Wear Your Heart', 'Print on Demand', 'Made to Order',
  'Natural Clothing', 'Ships to Canada & USA', 'Zero Waste', 'Made with Purpose',
]

// ─────────────────────────────────────────────────────────────────────────────
export default function HeroSection({
  latestProduct,
  productCount = 0,
}: HeroSectionProps) {
  const { tr } = useTranslation()
  const [mounted, setMounted] = useState(false)

  // Canvas / animation refs
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const animRef         = useRef<number>(0)
  const scrollYRef      = useRef(0)
  const targetScrollRef = useRef(0)

  // Parallax element refs
  const contentRef   = useRef<HTMLDivElement>(null)
  const imageRef     = useRef<HTMLDivElement>(null)
  const scrollIndRef = useRef<HTMLDivElement>(null)

  // Delay mount so SSR HTML shell matches client (avoids hydration flash)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  // ── Canvas: atmospheric water animation ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, t = 0

    // Caustic light blobs — drift slowly across the dark background
    const CAUSTICS = Array.from({ length: 12 }, () => ({
      x:     Math.random(),
      y:     Math.random() * 0.8 + 0.1,
      r:     Math.random() * 110 + 55,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.004 + 0.001,
      drift: (Math.random() - 0.5) * 0.0003,
    }))

    function resize() {
      if (!canvas) return
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function draw(timestamp: number) {
      t = timestamp * 0.001
      // Smooth scroll lag — canvas reacts to scrollY with inertia
      scrollYRef.current += (targetScrollRef.current - scrollYRef.current) * 0.06
      const sy = scrollYRef.current

      ctx.clearRect(0, 0, W, H)

      // Deep background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0,   'hsl(210,40%,4%)')
      bg.addColorStop(0.5, 'hsl(200,35%,3%)')
      bg.addColorStop(1,   'hsl(195,30%,2%)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Caustic blobs
      CAUSTICS.forEach(c => {
        c.x += c.drift
        if (c.x < -0.2) c.x = 1.2
        if (c.x >  1.2) c.x = -0.2
        const cx  = c.x * W
        const cy  = (c.y + Math.sin(t * c.speed * 8 + c.phase) * 0.04) * H - sy * 0.12
        const rad = c.r + Math.sin(t * c.speed * 6 + c.phase) * 20
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        grd.addColorStop(0,   'rgba(100,170,220,0.05)')
        grd.addColorStop(0.5, 'rgba(60,130,180,0.02)')
        grd.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.ellipse(cx, cy, rad, rad * 0.6, t * c.speed * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      })

      // Sine-wave layers (4 overlapping waves)
      WAVE_LAYERS.forEach((layer, i) => {
        const phase  = t * layer.speed + i * 1.1
        const baseY  = H * layer.yOff + sy * (0.08 + i * 0.02)
        const clampY = Math.min(baseY, H * 1.1)
        ctx.beginPath()
        ctx.moveTo(0, H)
        for (let x = 0; x <= W; x += 3) {
          const y = clampY
            + Math.sin(x * layer.freq + phase) * layer.amp
            + Math.sin(x * layer.freq * 1.7 + phase * 1.3) * (layer.amp * 0.45)
            + Math.sin(x * layer.freq * 0.5 + phase * 0.7) * (layer.amp * 0.3)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H)
        ctx.closePath()
        const wg = ctx.createLinearGradient(0, clampY - layer.amp, 0, H)
        wg.addColorStop(0,   layer.color + '55')
        wg.addColorStop(0.4, layer.color + '33')
        wg.addColorStop(1,   'rgba(5,12,20,0.95)')
        ctx.fillStyle = wg
        ctx.fill()
      })

      // Surface shimmer line
      const shimmerY = H * 0.52 + sy * 0.1 + Math.sin(t * 0.3) * 12
      const shimmer  = ctx.createLinearGradient(0, shimmerY - 2, 0, shimmerY + 2)
      shimmer.addColorStop(0,   'rgba(150,210,255,0)')
      shimmer.addColorStop(0.5, 'rgba(150,210,255,0.10)')
      shimmer.addColorStop(1,   'rgba(150,210,255,0)')
      ctx.fillStyle = shimmer
      ctx.fillRect(0, shimmerY - 1, W, 3)

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ── Parallax on scroll ─────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const sy    = window.scrollY
      targetScrollRef.current = sy
      const heroH = window.innerHeight
      if (sy < heroH) {
        // Text drifts slower than image for depth effect
        if (contentRef.current)   contentRef.current.style.transform   = `translateY(${sy * 0.45}px)`
        if (imageRef.current)     imageRef.current.style.transform     = `translateY(${sy * 0.25}px)`
        if (scrollIndRef.current) scrollIndRef.current.style.opacity   = String(Math.max(0, 1 - sy / 180))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /**
   * CTA click handler
   * Fires a custom DOM event before navigating. Attach listeners anywhere:
   *   window.addEventListener('hw:hero_cta_click', (e) => analyticsTrack(e.detail))
   */
  function handleShopNow() {
    window.dispatchEvent(new CustomEvent('hw:hero_cta_click', {
      detail: { source: 'hero_banner', productCount, hasNewDrop: !!latestProduct },
    }))
  }

  // Resolve the hero product image (default first, then first available)
  const heroImage = latestProduct?.images?.find(img => img.is_default)?.src
    ?? latestProduct?.images?.[0]?.src
    ?? null

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--hw-black)' }}
    >

      {/* ── Layer 0: canvas water animation ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* ── Layer 0: subtle hero photo behind water ── */}
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        unoptimized
        className="object-cover object-center"
        style={{ opacity: 0.10, zIndex: 0 }}
      />

      {/* ── Layer 1: directional gradient vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to right, rgba(10,10,10,0.92) 42%, rgba(10,10,10,0.05) 100%)',
            'linear-gradient(to top,   rgba(10,10,10,0.98) 0%,  transparent 50%)',
          ].join(', '),
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL — product lifestyle image (parallax, desktop only)
          Hidden on mobile via CSS; stacks below text on small screens.
      ═══════════════════════════════════════════════════════════════════ */}
      {heroImage && (
        <div
          ref={imageRef}
          className="hidden md:block absolute pointer-events-none"
          style={{
            right: '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(260px, 36vw, 500px)',
            zIndex: 2,
            willChange: 'transform',
          }}
          aria-hidden="true"
        >
          {/* Clay glow halo behind the product image */}
          <div style={{
            position: 'absolute',
            inset: '-20%',
            background: 'radial-gradient(ellipse at center, rgba(193,124,90,0.14) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          <img
            src={heroImage}
            alt={latestProduct?.title ?? 'Latest drop'}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              opacity: 0.90,
              // Blend with the water so it feels submerged, not pasted on
              mixBlendMode: 'luminosity',
              filter: 'contrast(1.04) saturate(0.80)',
            }}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LEFT PANEL — editorial text content
          max-width keeps it readable on ultra-wide screens.
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={contentRef}
        className="relative flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 pb-28 pt-36"
        style={{ zIndex: 3, maxWidth: '600px', willChange: 'transform' }}
      >

        {/* ── NEW DROP badge — only when we have a live product ── */}
        {latestProduct && (
          <div
            className={`transition-all duration-500 delay-[50ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            style={{ marginBottom: '18px' }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--et-clay)',
              color: '#fff',
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.57rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              padding: '5px 12px',
              borderRadius: '2px',
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#fff',
                animation: 'pulseDot 2s ease-in-out infinite',
              }} />
              New Drop
            </span>
          </div>
        )}

        {/* ── Eyebrow line ── */}
        <div
          className={`flex items-center gap-3 mb-5 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '0.60rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--et-sage)',
          }}
        >
          <span style={{ display: 'block', width: '24px', height: '1px', background: 'var(--et-sage)' }} />
          {tr.hero_eyebrow}
        </div>

        {/* ── Headline line 1 — sand (light earth tone) ── */}
        <h1
          className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: 'clamp(2.8rem, 6vw, 5.2rem)',
            lineHeight: '1.02',
            letterSpacing: '-0.02em',
            color: 'var(--et-sand)',
            marginBottom: '6px',
          }}
        >
          {tr.hero_heading_line1}
        </h1>

        {/* ── Headline line 2 — clay italic (earth tone accent) ── */}
        <h1
          className={`transition-all duration-700 delay-[260ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: 'clamp(2.8rem, 6vw, 5.2rem)',
            lineHeight: '1.02',
            letterSpacing: '-0.02em',
            color: 'var(--et-clay)',
            fontStyle: 'italic',
            marginBottom: '28px',
          }}
        >
          {tr.hero_heading_line2}
        </h1>

        {/* ── Body copy ── */}
        <p
          className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            fontSize: '0.92rem',
            lineHeight: '1.78',
            color: 'var(--hw-light)',
            maxWidth: '380px',
            marginBottom: '40px',
            fontWeight: 300,
          }}
        >
          {tr.hero_body}
        </p>

        {/* ── CTAs ── */}
        <div
          className={`flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* PRIMARY — clay fill, hover to moss */}
          <Link
            href="/shop"
            onClick={handleShopNow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'var(--et-clay)',
              color: '#fff',
              padding: '14px 32px',
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.60rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'background 0.25s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--et-moss)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--et-clay)')}
          >
            {tr.hero_cta_shop} →
          </Link>

          {/* SECONDARY — ghost outline */}
          <Link href="/about" className="btn-outline">
            {tr.hero_cta_story}
          </Link>
        </div>

        {/* ── Live stat — product count with moss pulse dot ── */}
        {productCount > 0 && (
          <div
            className={`flex items-center gap-3 mt-10 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            <span style={{
              display: 'inline-block',
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: 'var(--et-moss)',
              animation: 'pulseDot 2.4s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.57rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--hw-muted)',
            }}>
              {productCount} live drop{productCount !== 1 ? 's' : ''} — all printed on demand
            </span>
          </div>
        )}
      </div>

      {/* ── Scroll indicator (fades on scroll) ── */}
      <div
        ref={scrollIndRef}
        className="absolute flex flex-col items-center gap-2"
        style={{ bottom: '44px', right: '36px', zIndex: 3 }}
        aria-hidden="true"
      >
        <div style={{
          width: '1px',
          height: '48px',
          background: 'linear-gradient(to bottom, var(--et-sage), transparent)',
          animation: 'scrollPulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.52rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          writingMode: 'vertical-rl',
          color: 'var(--et-sage)',
        }}>
          Scroll
        </span>
      </div>

      {/* ── Bottom marquee strip ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 border-t overflow-hidden flex items-center"
        style={{ zIndex: 4, borderColor: 'var(--hw-border)', background: 'rgba(10,10,10,0.75)' }}
        aria-label="Brand values ticker"
      >
        <div className="animate-marquee whitespace-nowrap inline-flex">
          {MARQUEE.map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '0.56rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--et-sage)',
                margin: '0 36px',
              }}
            >
              ✦ {item}
            </span>
          ))}
        </div>
      </div>

    </section>
  )
}
