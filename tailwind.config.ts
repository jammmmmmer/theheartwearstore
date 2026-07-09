import type { Config } from 'tailwindcss'

/**
 * Direction C — "Heartline" (bone white + ink + one heart red).
 *
 * IMPORTANT: the `stone` and `sage` scales are INVERTED relative to
 * Tailwind defaults. The site was originally built dark (bg-stone-950 +
 * text-stone-50 everywhere); inverting the scales flips every existing
 * usage to the light theme without touching each component:
 *   bg-stone-950  → bone background
 *   text-stone-50 → ink text
 *   border-stone-800 → soft warm border
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Syne for display, Manrope for UI, Fraunces italic for poetry
        serif:    ['var(--font-syne)', 'sans-serif'],
        mono:     ['var(--font-manrope)', 'sans-serif'],
        sans:     ['var(--font-manrope)', 'sans-serif'],
        poetic:   ['var(--font-fraunces)', 'Georgia', 'serif'],
        // Legacy aliases so no existing reference breaks
        playfair: ['var(--font-syne)', 'sans-serif'],
        inter:    ['var(--font-manrope)', 'sans-serif'],
      },
      colors: {
        hw: {
          black:   '#f6f4ef',
          off:     '#ffffff',
          surface: '#ffffff',
          border:  '#e4e0d8',
          muted:   '#6d675e',
          mid:     '#4c4842',
          light:   '#3a3630',
          white:   '#12100e',
          accent:  '#d64533',
          accent2: '#b23222',
        },
        // Legacy earth tones, remapped to the new accent roles
        et: {
          clay: '#d64533',
          sage: '#4e684e',
          moss: '#3f5a3f',
          sand: '#12100e',
          bark: '#ffffff',
        },
        // INVERTED bone-warm stone scale (see file header)
        stone: {
          50:  '#12100e',
          100: '#26231f',
          200: '#3a3630',
          300: '#4c4842',
          400: '#5f5952',
          500: '#6d675e',
          600: '#98928a',
          700: '#cfc9bd',
          800: '#e4e0d8',
          900: '#efece5',
          950: '#f6f4ef',
        },
        // INVERTED sage scale — text-sage-400/500 read on light ground
        sage: {
          50:  '#293929',
          100: '#304530',
          200: '#3a553a',
          300: '#486b48',
          400: '#5c875c',
          500: '#527a52',
          600: '#7da47d',
          700: '#a8c3a8',
          800: '#cddccd',
          900: '#e6ede6',
        },
      },
      borderRadius: {
        card: '22px',
        control: '14px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(18,16,14,0.05)',
        'card-hover': '6px 6px 0 #12100e',
        'press': '0 5px 0 #b23222',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in':  'fadeIn 0.2s ease-out',
        'marquee':  'marquee 28s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
