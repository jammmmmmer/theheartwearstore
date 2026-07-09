'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

/**
 * Gildan 64000 Softstyle unisex tee — published garment measurements (inches).
 * Rows render only for sizes the product actually offers.
 */
const MEASUREMENTS: Record<string, { width: number; length: number }> = {
  XS:    { width: 16.5, length: 27 },
  S:     { width: 18,   length: 28 },
  M:     { width: 20,   length: 29 },
  L:     { width: 22,   length: 30 },
  XL:    { width: 24,   length: 31 },
  '2XL': { width: 26,   length: 32 },
  '3XL': { width: 28,   length: 33 },
  '4XL': { width: 30,   length: 34 },
  '5XL': { width: 32,   length: 35 },
}

export default function SizeChart({ sizes }: { sizes: string[] }) {
  const { tr } = useTranslation()
  const [open, setOpen] = useState(false)

  const rows = sizes
    .map((s) => ({ size: s, m: MEASUREMENTS[s.trim().toUpperCase()] }))
    .filter((r): r is { size: string; m: { width: number; length: number } } => Boolean(r.m))

  if (!rows.length) return null

  return (
    <div className="border-t border-stone-800 pt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-xs uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
        aria-expanded={open}
      >
        {tr.product_size_chart}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-stone-600">
              <th className="text-left pb-2 font-normal">{tr.size_chart_size}</th>
              <th className="text-right pb-2 font-normal">{tr.size_chart_width}</th>
              <th className="text-right pb-2 font-normal">{tr.size_chart_length}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ size, m }) => (
              <tr key={size} className="border-t border-stone-800/60 text-stone-400">
                <td className="py-2">{size}</td>
                <td className="py-2 text-right font-mono text-xs">{m.width}</td>
                <td className="py-2 text-right font-mono text-xs">{m.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
