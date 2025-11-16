interface ConfettiProps {
  show: boolean
}

export function Confetti({ show }: ConfettiProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="confetti-animation text-6xl">🎉</div>
    </div>
  )
}

