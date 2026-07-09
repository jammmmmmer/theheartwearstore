'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Currency, DEFAULT_CURRENCY, priceInCurrency, formatMoney } from './currency'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  /** Format a canonical CAD-cents price in the active currency. */
  display: (cadCents: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  display: (cadCents) => formatMoney(cadCents, DEFAULT_CURRENCY),
})

const STORAGE_KEY = 'heartwear-currency'

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'cad' || stored === 'usd') {
      setCurrencyState(stored)
      return
    }
    // No explicit preference — default US visitors to USD via CDN geo header
    fetch('/api/geo')
      .then((res) => res.json())
      .then((data: { country?: string }) => {
        if (data.country === 'US') setCurrencyState('usd')
      })
      .catch(() => {}) // default stays CAD
  }, [])

  function setCurrency(next: Currency) {
    setCurrencyState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const display = (cadCents: number) =>
    formatMoney(priceInCurrency(cadCents, currency), currency)

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, display }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
