'use client'

import { useEffect, useState } from 'react'

interface CompassScoreGaugeProps {
  score: number
  maturityLevel: 1 | 2 | 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { radius: 38, strokeWidth: 6, svgSize: 92, scoreSize: 25, labelSize: 8 },
  md: { radius: 54, strokeWidth: 8, svgSize: 132, scoreSize: 34, labelSize: 9 },
  lg: { radius: 70, strokeWidth: 9, svgSize: 172, scoreSize: 46, labelSize: 10 },
}

export default function CompassScoreGauge({ score, maturityLevel, size = 'lg' }: CompassScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const scoreColor = {
    1: 'var(--red)',
    2: 'var(--amber)',
    3: 'var(--blue)',
    4: 'var(--accent)',
    5: 'var(--green)',
  }[maturityLevel]

  useEffect(() => {
    const duration = 1200
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, score)
      setAnimatedScore(Math.round(current))
      if (current >= score) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score])

  const { radius, strokeWidth, svgSize, scoreSize, labelSize } = SIZE_CONFIG[size]
  const circumference = 2 * Math.PI * radius
  const cx = svgSize / 2
  const cy = svgSize / 2
  const dashOffset = circumference - (circumference * animatedScore) / 100

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      role="img"
      aria-label={`Readiness score ${score} out of 100`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="var(--bg-2)"
        stroke="var(--line)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={scoreColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          transition: 'stroke-dashoffset 80ms linear',
        }}
      />
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--text)"
        style={{ fontSize: scoreSize, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}
      >
        {animatedScore}
      </text>
      <text
        x={cx}
        y={cy + scoreSize * 0.44}
        textAnchor="middle"
        fill="var(--text-faint)"
        style={{ fontSize: labelSize, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        out of 100
      </text>
    </svg>
  )
}
