import { cn } from '@/lib/utils'

type CommunityBonusLeavesBurstProps = {
  active: boolean
  className?: string
}

/** Animation courte de « collecte » de feuilles bonus (pure CSS). */
export function CommunityBonusLeavesBurst({ active, className }: CommunityBonusLeavesBurstProps) {
  if (!active) return null

  const leaves = ['🌿', '🍃', '🌱', '🌿', '🍃', '🌿', '🍃', '🌱']

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl', className)}
      aria-hidden
    >
      {leaves.map((leaf, i) => (
        <span
          key={i}
          className="absolute animate-[community-leaf-rise_1.8s_ease-out_forwards] text-lg opacity-0"
          style={{
            left: `${8 + i * 11}%`,
            bottom: '10%',
            animationDelay: `${i * 0.08}s`,
          }}
        >
          {leaf}
        </span>
      ))}
      <style>{`
        @keyframes community-leaf-rise {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-140px) scale(1.1) rotate(25deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
