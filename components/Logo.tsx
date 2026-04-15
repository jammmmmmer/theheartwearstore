interface LogoProps {
  className?: string
}

// Reusable heart SVG used inside the wordmark
export function HeartA() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        top: '-0.08em',
        margin: '0 0.01em',
      }}
    >
      <svg
        viewBox="0 0 20 18"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '0.65em', height: '0.65em', fill: 'var(--hw-accent)' }}
        aria-hidden="true"
      >
        <path d="M10 17S1 11 1 5.5A4.5 4.5 0 0110 3a4.5 4.5 0 019 2.5C19 11 10 17 10 17z" />
      </svg>
    </span>
  )
}

// Full wordmark: "The He♥rtwear Store"
export default function Logo({ className = '' }: LogoProps) {
  return (
    <span className={className} style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
      The He<HeartA />rtwear Store
    </span>
  )
}
