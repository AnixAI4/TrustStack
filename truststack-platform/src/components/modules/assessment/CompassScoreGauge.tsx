'use client'

import { useEffect, useState } from 'react'
import { MATURITY_LEVELS } from '@/lib/constants'

interface CompassScoreGaugeProps {
  score: number
  maturityLevel: 1 | 2 | 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: { radius: 40,  strokeWidth: 7,  fontSize: 'text-2xl' },
  md: { radius: 60,  strokeWidth: 10, fontSize: 'text-4xl' },
  lg: { radius: 80,  strokeWidth: 12, fontSize: 'text-5xl' },
}

export default function CompassScoreGauge({ score, maturityLevel, size = 'lg' }: CompassScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const maturityConfig = MATURITY_LEVELS[maturityLevel]

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

  const { radius, strokeWidth, fontSize } = SIZE_CONFIG[size]
  const circumference = 2 * Math.PI * radius
  // Use 270° arc (3/4 of circle), starting from bottom-left
  const arcLength = circumference * 0.75
  const dashOffset = arcLength - (arcLength * animatedScore) / 100

  const svgSize = (radius + strokeWidth + 4) * 2
  const cx = svgSize / 2
  const cy = svgSize / 2

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={svgSize}
          height={svgSize * 0.85}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ overflow: 'visible' }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-circumference * 0.125}
            strokeLinecap="round"
            style={{ transform: 'rotate(-225deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
          {/* Score arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={maturityConfig.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-circumference * 0.125 + dashOffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-225deg)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'stroke-dashoffset 0.05s linear',
            }}
          />
          {/* Score text */}
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`${fontSize} font-bold`}
            fill={maturityConfig.color}
            style={{ fontSize: size === 'lg' ? 36 : size === 'md' ? 28 : 20, fontWeight: 700 }}
          >
            {animatedScore}
          </text>
          <text
            x={cx}
            y={cy + (size === 'lg' ? 28 : size === 'md' ? 22 : 16)}
            textAnchor="middle"
            fill="#9CA3AF"
            style={{ fontSize: 11 }}
          >
            out of 100
          </text>
        </svg>
      </div>

      <div
        className="mt-1 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ color: maturityConfig.color, backgroundColor: maturityConfig.bgColor }}
      >
        Level {maturityLevel}: {maturityConfig.label}
      </div>
    </div>
  )
}
