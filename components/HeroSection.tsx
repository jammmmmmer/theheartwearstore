'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/language-context'

export default function HeroSection() {
  const { tr } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const scrollYRef = useRef(0)
  const targetScrollYRef = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const scrollIndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  /* ── Water canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, t = 0

    const LAYERS = [
      { speed: 0.28, amp: 38, freq: 0.008, color: '#1a3040', yOff: 0.55 },
      { speed: 0.18, amp: 28, freq: 0.013, color: '#0d2030', yOff: 0.60 },
      { speed: 0.38, amp: 22, freq: 0.018, color: '#233545', yOff: 0.58 },
      { speed: 0.12, amp: 48, freq: 0.006, color: '#0a1520', yOff: 0.65 },
    ]

    const CAUSTICS = Array.from({ length: 12 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.8 + 0.1,
      r: Math.random() * 110 + 55,
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
      scrollYRef.current += (targetScrollYRef.current - scrollYRef.current) * 0.06
      const sy = scrollYRef.current

      ctx.clearRect(0, 0, W, H)

      // Deep background
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0,   'hsl(210,40%,4%)')
      bg.addColorStop(0.5, 'hsl(200,35%,3%)')
      bg.addColorStop(1,   'hsl(195,30%,2%)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Caustic light
      CAUSTICS.forEach(c => {
        c.x += c.drift
        if (c.x < -0.2) c.x = 1.2
        if (c.x > 1.2)  c.x = -0.2
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

      // Wave layers
      LAYERS.forEach((layer, i) => {
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

      // Surface shimmer
      const shimmerY = H * 0.52 + sy * 0.1 + Math.sin(t * 0.3) * 12
      const shimmer = ctx.createLinearGradient(0, shimmerY - 2, 0, shimmerY + 2)
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

  /* ── Parallax on scroll ── */
  useEffect(() => {
    function onScroll() {
      const sy = window.scrollY
      targetScrollYRef.current = sy
      const heroH = window.innerHeight
      if (sy < heroH) {
        if (parallaxRef.current)  parallaxRef.current.style.transform  = `translateY(${sy * 0.35}px)`
        if (contentRef.current)   contentRef.current.style.transform   = `translateY(${sy * 0.55}px)`
        if (scrollIndRef.current) scrollIndRef.current.style.opacity   = String(Math.max(0, 1 - sy / 200))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const MARQUEE = [
    'Wear Your Heart', 'Print on Demand', 'Made to Order',
    'Natural Clothing', 'Ships to Canada & USA', 'Zero Waste',
    'Made with Purpose',
    'Wear Your Heart', 'Print on Demand', 'Made to Order',
    'Natural Clothing', 'Ships to Canada & USA', 'Zero Waste',
    'Made with Purpose',
  ]

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--hw-black)' }}>

        {/* Water canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        />

        {/* Hero bg photo (subtle, behind water) */}
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-center"
          style={{ opacity: 0.12, zIndex: 0 }}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(10,10,10,0.82) 40%, rgba(10,10,10,0.15) 100%), linear-gradient(to top, rgba(10,10,10,0.95) 0%, transparent 55%)',
            zIndex: 1,
          }}
        />

        {/* Background parallax layer — ghost tee */}
        <div
          ref={parallaxRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 2, willChange: 'transform' }}
        >
          <div
            className="absolute"
            style={{
              right: '8%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36vw',
              maxWidth: '460px',
              opacity: 0.06,
            }}
          >
            <svg viewBox="0 0 400 420" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
              <path d="M 140 20 C 140 20 155 60 200 60 C 245 60 260 20 260 20 L 340 60 L 390 130 L 320 160 L 320 400 L 80 400 L 80 160 L 10 130 L 60 60 Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M 255 162 C 255 162 237 148 237 137 C 237 128 244 122 251 124 C 253 125 255 128 255 128 C 255 128 257 125 259 124 C 266 122 273 128 273 137 C 273 148 255 162 255 162 Z" fill="#c9402a" opacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div
          ref={contentRef}
          className="relative flex-1 flex flex-col justify-end px-6 sm:px-12 pb-20 pt-32"
          style={{ zIndex: 3, maxWidth: '680px', willChange: 'transform' }}
        >
          {/* Eyebrow */}
          <div
            className={`flex items-center gap-3 mb-5 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '0.62rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--hw-accent)',
            }}
          >
            <span style={{ display: 'block', width: '28px', height: '1px', background: 'var(--hw-accent)' }} />
            {tr.hero_eyebrow}
          </div>

          {/* Headline */}
          <h1
            className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: 'clamp(3rem, 6.5vw, 5.5rem)',
              lineHeight: '1.0',
              letterSpacing: '-0.02em',
              color: 'var(--hw-white)',
              marginBottom: '24px',
            }}
          >
            {tr.hero_heading_line1}
            <br />
            <em style={{ color: 'var(--hw-accent2)' }}>{tr.hero_heading_line2}</em>
          </h1>

          {/* Body */}
          <p
            className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              fontSize: '0.95rem',
              lineHeight: '1.75',
              color: 'var(--hw-light)',
              maxWidth: '400px',
              marginBottom: '40px',
              fontWeight: 300,
            }}
          >
            {tr.hero_body}
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Link href="/shop" className="btn-primary">{tr.hero_cta_shop} →</Link>
            <Link href="/about" className="btn-outline">{tr.hero_cta_story}</Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndRef}
          className="absolute flex flex-col items-center gap-2"
          style={{ bottom: '40px', right: '40px', zIndex: 3, color: 'var(--hw-muted)' }}
        >
          <div
            style={{
              width: '1px',
              height: '48px',
              background: 'linear-gradient(to bottom, var(--hw-muted), transparent)',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>
            Scroll
          </span>
        </div>

        {/* Bottom marquee strip */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10 border-t overflow-hidden flex items-center"
          style={{ zIndex: 4, borderColor: 'var(--hw-border)', background: 'rgba(10,10,10,0.7)' }}
        >
          <div className="animate-marquee whitespace-nowrap inline-flex">
            {MARQUEE.map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'var(--hw-muted)',
                  margin: '0 40px',
                }}
              >
                ✦ {item}
              </span>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
