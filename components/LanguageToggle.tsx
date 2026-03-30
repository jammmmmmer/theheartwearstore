'use client'
import { useTranslation } from '@/lib/language-context'

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation()
  return (
    <div className="flex items-center text-xs font-medium tracking-wider">
      <button
        onClick={() => setLang('en')}
        className={`px-1.5 py-0.5 transition-colors ${lang === 'en' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-stone-300 select-none">|</span>
      <button
        onClick={() => setLang('fr')}
        className={`px-1.5 py-0.5 transition-colors ${lang === 'fr' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
        aria-label="Passer en français"
      >
        FR
      </button>
    </div>
  )
}
