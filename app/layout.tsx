import type { Metadata, Viewport } from 'next'
import { Syne, Manrope, Fraunces } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { LanguageProvider } from '@/lib/language-context'
import { CurrencyProvider } from '@/lib/currency-context'

/**
 * Direction C — "Heartline" type system.
 * Syne (bold display headlines), Manrope (UI/body), Fraunces italic as the
 * single "poetic" accent voice. Legacy CSS vars (--font-dm-serif /
 * --font-space-mono / --font-dm-sans) are remapped in globals.css so every
 * existing reference inherits the new system without per-component changes.
 */
const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: 'The Heartwear Store',
    template: '%s | The Heartwear Store',
  },
  description:
    'Wear what matters. Natural, thoughtfully made clothing printed on demand for every generation. Ships to Canada & USA.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.theheartwearstore.ca'
  ),
  keywords: ['heartwear', 'print on demand', 'custom t-shirts', 'natural clothing', 'Canada', 'made to order'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    siteName: 'The Heartwear Store',
    type: 'website',
    locale: 'en_CA',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'The Heartwear Store — Wear what matters.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Heartwear Store',
    description: 'Wear what matters. Natural clothing printed on demand.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${manrope.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans min-h-screen flex flex-col bg-stone-950 text-stone-50"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <CurrencyProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
