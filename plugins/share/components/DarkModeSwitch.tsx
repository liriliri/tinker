import className from 'licia/className'
import { Sun, Moon } from 'lucide-react'

interface DarkModeSwitchProps {
  dark: boolean
  onToggle: () => void
  title?: string
  className?: string
}

export default function DarkModeSwitch({
  dark,
  onToggle,
  title,
  className: extraClassName = '',
}: DarkModeSwitchProps) {
  return (
    <button
      onClick={onToggle}
      title={title}
      className={className(
        `relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out ${extraClassName}`,
        {
          'bg-gray-700 dark:bg-gray-600': dark,
          'bg-gray-300': !dark,
        }
      )}
    >
      <div
        className={className(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ease-in-out',
          {
            'translate-x-5': dark,
            'translate-x-0': !dark,
          }
        )}
      >
        {dark ? (
          <Moon size={10} className="text-gray-700" />
        ) : (
          <Sun size={10} className="text-amber-500" />
        )}
      </div>
    </button>
  )
}
