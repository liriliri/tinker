import { observer } from 'mobx-react-lite'
import { THEME_COLORS } from 'share/theme'

interface CircularProgressProps {
  progress: number // 0-100
  mode: 'focus' | 'shortBreak' | 'longBreak'
  children?: React.ReactNode
}

const MODE_COLORS = {
  focus: '#ff6b6b',
  shortBreak: THEME_COLORS.primary,
  longBreak: THEME_COLORS.primary,
} as const

export default observer(function CircularProgress({
  progress,
  mode,
  children,
}: CircularProgressProps) {
  const size = 220
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = (progress / 100) * circumference

  const strokeColor = MODE_COLORS[mode]

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
