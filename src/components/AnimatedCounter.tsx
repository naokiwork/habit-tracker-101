import { useEffect, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 500, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (value === displayValue) return

    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * easeOut)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
  }, [value, displayValue, duration])

  return <span className={className}>{displayValue}</span>
}

