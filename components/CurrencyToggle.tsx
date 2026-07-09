'use client'
import { useCurrency } from '@/lib/currency-context'

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  return (
    <div className="flex items-center text-xs font-medium tracking-wider">
      <button
        onClick={() => setCurrency('cad')}
        className={`px-1.5 py-0.5 transition-colors ${currency === 'cad' ? 'text-stone-100' : 'text-stone-500 hover:text-stone-300'}`}
        aria-label="Prices in Canadian dollars"
      >
        CAD
      </button>
      <span className="text-stone-600 select-none">|</span>
      <button
        onClick={() => setCurrency('usd')}
        className={`px-1.5 py-0.5 transition-colors ${currency === 'usd' ? 'text-stone-100' : 'text-stone-500 hover:text-stone-300'}`}
        aria-label="Prices in US dollars"
      >
        USD
      </button>
    </div>
  )
}
