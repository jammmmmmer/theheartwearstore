import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const states = {
  approved: {
    icon: '✓',
    iconColor: 'text-sage-400',
    iconBg: 'bg-sage-900/30',
    heading: 'Design approved!',
    body: 'Your new product has been published to the store. It\'s live right now.',
    action: { href: '/shop', label: 'View the shop' },
  },
  rejected: {
    icon: '✕',
    iconColor: 'text-stone-400',
    iconBg: 'bg-stone-800',
    heading: 'Design rejected.',
    body: 'Got it. The draft has been deleted from Printify. Nothing was published.',
    action: { href: '/', label: 'Back to home' },
  },
  'already-used': {
    icon: '○',
    iconColor: 'text-stone-500',
    iconBg: 'bg-stone-800',
    heading: 'Already used.',
    body: 'This link has already been used. No further action is needed.',
    action: { href: '/', label: 'Back to home' },
  },
  invalid: {
    icon: '!',
    iconColor: 'text-stone-500',
    iconBg: 'bg-stone-800',
    heading: 'Link expired or invalid.',
    body: 'This link has expired or is no longer valid. Links are valid for 7 days.',
    action: { href: '/', label: 'Back to home' },
  },
  error: {
    icon: '!',
    iconColor: 'text-stone-500',
    iconBg: 'bg-stone-800',
    heading: 'Something went wrong.',
    body: 'An unexpected error occurred. Please try again or contact support.',
    action: { href: '/', label: 'Back to home' },
  },
}

export default async function AutoProductResultPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const state = states[status as keyof typeof states] ?? states.invalid

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-full ${state.iconBg} flex items-center justify-center mx-auto mb-6`}>
          <span className={`text-2xl font-bold ${state.iconColor}`}>{state.icon}</span>
        </div>

        <h1 className="text-2xl font-serif text-stone-50 mb-3">{state.heading}</h1>
        <p className="text-stone-400 text-base leading-relaxed mb-8">{state.body}</p>

        <Link
          href={state.action.href}
          className="inline-block bg-sage-600 hover:bg-sage-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          {state.action.label}
        </Link>
      </div>
    </main>
  )
}
