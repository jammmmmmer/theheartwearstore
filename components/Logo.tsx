interface LogoProps {
  className?: string
  /** 'light' = white text for dark backgrounds (header), 'dark' = dark text for light backgrounds */
  variant?: 'light' | 'dark'
}

export default function Logo({ className = '', variant = 'light' }: LogoProps) {
  const textColor = variant === 'light' ? '#f5f5f4' : '#1c1917'
  const hangerColor = variant === 'light' ? '#f5f5f4' : '#1c1917'

  return (
    <svg
      viewBox="0 0 220 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="The Heartwear Store"
      role="img"
    >
      {/* Hanger */}
      <g transform="translate(2, 2)">
        {/* Hook */}
        <path
          d="M24 4 C24 1.8 22.2 0 20 0 C17.8 0 16 1.8 16 4 C16 5.5 16.8 6.8 18 7.5"
          fill="none"
          stroke={hangerColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Hanger body */}
        <path
          d="M18 8 L8 22 L32 22"
          fill="none"
          stroke={hangerColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Small heart inside hanger */}
        <path
          d="M20 15 C20 15 17 12.5 17 10.8 C17 9.8 17.8 9 18.8 9 C19.4 9 20 9.4 20 9.4 C20 9.4 20.6 9 21.2 9 C22.2 9 23 9.8 23 10.8 C23 12.5 20 15 20 15Z"
          fill="#e63636"
        />
      </g>

      {/* THE */}
      <text
        x="38"
        y="44"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill={textColor}
        letterSpacing="0.5"
      >
        THE
      </text>

      {/* Heart */}
      <path
        d="M94 28 C94 28 84 21 84 14.5 C84 10.4 87.1 7 91 7 C92.7 7 94 8 94 8 C94 8 95.3 7 97 7 C100.9 7 104 10.4 104 14.5 C104 21 94 28 94 28Z"
        fill="#e63636"
        transform="translate(0, 16)"
      />

      {/* WEAR */}
      <text
        x="110"
        y="44"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill={textColor}
        letterSpacing="0.5"
      >
        WEAR
      </text>

      {/* STORE */}
      <text
        x="110"
        y="60"
        fontFamily="Arial, sans-serif"
        fontWeight="400"
        fontSize="13"
        fill={textColor}
        letterSpacing="2"
      >
        STORE
      </text>
    </svg>
  )
}
