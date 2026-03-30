'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { t, Lang } from './translations'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  tr: typeof t.en | typeof t.fr
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  tr: t.en as typeof t.en | typeof t.fr,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = localStorage.getItem('heartwear-lang') as Lang | null
    if (stored === 'en' || stored === 'fr') setLangState(stored)
  }, [])

  function setLang(newLang: Lang) {
    setLangState(newLang)
    localStorage.setItem('heartwear-lang', newLang)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
