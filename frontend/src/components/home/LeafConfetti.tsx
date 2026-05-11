import { useEffect, useRef } from 'react'

interface Leaf {
  id: number
  x: number
  size: number
  delay: number
  duration: number
  rotation: number
  rotationSpeed: number
  emoji: string
  swayAmount: number
}

const LEAF_EMOJIS = ['🍃', '🌿', '🍀', '🌱']

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generateLeaves(count: number): Leaf[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(0, 100),
    size: randomBetween(16, 32),
    delay: randomBetween(0, 0.8),
    duration: randomBetween(1.8, 3.2),
    rotation: randomBetween(-30, 30),
    rotationSpeed: randomBetween(-360, 360),
    emoji: LEAF_EMOJIS[Math.floor(Math.random() * LEAF_EMOJIS.length)],
    swayAmount: randomBetween(30, 80),
  }))
}

interface LeafConfettiProps {
  active: boolean
  onDone: () => void
  count?: number
}

export function LeafConfetti({ active, onDone, count = 30 }: LeafConfettiProps) {
  const leavesRef = useRef<Leaf[]>(generateLeaves(count))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) return

    leavesRef.current = generateLeaves(count)

    const maxDuration = Math.max(...leavesRef.current.map((l) => l.delay + l.duration))
    timerRef.current = setTimeout(onDone, (maxDuration + 0.2) * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, count, onDone])

  if (!active) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {leavesRef.current.map((leaf) => (
        <span
          key={leaf.id}
          style={{
            position: 'absolute',
            left: `${leaf.x}%`,
            top: '-40px',
            fontSize: `${leaf.size}px`,
            animation: `leaf-fall ${leaf.duration}s ${leaf.delay}s ease-in forwards`,
            '--sway': `${leaf.swayAmount}px`,
            '--rot-end': `${leaf.rotationSpeed}deg`,
            '--rot-start': `${leaf.rotation}deg`,
          } as React.CSSProperties}
        >
          {leaf.emoji}
        </span>
      ))}

      <style>{`
        @keyframes leaf-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(var(--rot-start));
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) translateX(var(--sway)) rotate(calc(var(--rot-end) * 0.5));
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(calc(var(--sway) * -0.3)) rotate(var(--rot-end));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
