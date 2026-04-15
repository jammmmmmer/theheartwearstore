import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // New Heartwear brand fonts
        serif:    ['var(--font-dm-serif)', 'Georgia', 'serif'],
        mono:     ['var(--font-space-mono)', 'monospace'],
        sans:     ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        // Legacy aliases so no existing reference breaks
        playfair: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        inter:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        hw: {
          black:   '#0a0a0a',
          off:     '#111111',
          surface: '#161616',
          border:  '#222222',
          muted:   '#555555',
          mid:     '#888888',
          light:   '#cccccc',
          white:   '#f5f2ee',
          accent:  '#c9402a',
          accent2: '#e8d5b0',
        },
        // 2026 Earth Tone palette
        et: {
          clay: '#c17c5a',
          sage: '#8aab8a',
          moss: '#4a6741',
          sand: '#e8ddd0',
          bark: '#2e2118',
        },
        // Keep sage so any remaining usages don't explode
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#cddccd',
          300: '#a8c3a8',
          400: '#7da47d',
          500: '#5c875c',
          600: '#486b48',
          700: '#3a553a',
          800: '#304530',
          900: '#293929',
        },
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
