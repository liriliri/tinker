import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { getGravatarUrl } from '../lib/util'

const AUTHOR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-emerald-500',
]

function authorColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length]
}

interface AuthorAvatarProps {
  name: string
  email: string
}

export default observer(function AuthorAvatar({
  name,
  email,
}: AuthorAvatarProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fallbackBg = authorColor(name)
  const initial = name.charAt(0).toUpperCase()

  const showFallback = !loaded || error

  return (
    <span className="shrink-0 w-5 h-5 rounded-full relative overflow-hidden">
      {showFallback && (
        <span
          className={`absolute inset-0 ${fallbackBg} flex items-center justify-center text-[10px] text-white font-semibold`}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <img
        src={getGravatarUrl(email, 40)}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </span>
  )
})
