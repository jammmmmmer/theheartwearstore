import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout Cancelled',
}

export default function CancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
            <ShoppingBag size={32} strokeWidth={1} className="text-stone-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-playfair text-4xl text-stone-900">No worries</h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Your order wasn&apos;t completed. Your cart is still waiting for you — nothing has
            been charged.
          </p>
        </div>

        <div className="bg-stone-100 px-6 py-4 text-sm text-stone-600 italic">
          &ldquo;Good things don&apos;t rush. Come back when it feels right.&rdquo;
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary inline-block">
            Back to Shop
          </Link>
          <Link href="/" className="btn-outline inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
