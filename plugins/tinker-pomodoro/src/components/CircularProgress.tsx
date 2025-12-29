import { observer } from 'mobx-react-lite'

interface CircularProgressProps {
  progress: number // 0-100
  mode: 'focus' | 'shortBreak' | 'longBreak'
  children?: React.ReactNode
}

export default observer(function CircularProgress({
  progress,
  mode,
  children,
}: CircularProgressProps) {
  const size = 220
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  // Color based on mode
  const strokeColor =
    mode === 'focus' ? '#ff6b6b' : mode === 'shortBreak' ? '#4ecdc4' : '#45b7d1'

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-gray-300 dark:text-gray-600"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
})
