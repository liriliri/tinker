export type PlayMode = 'sequence' | 'loop' | 'shuffle'
export type SideTab = 'local' | 'recent' | 'favorite' | 'sheet'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  cover?: string
  path: string
}

export interface RecentTrack extends Track {
  playedAt: number
}

export interface MusicSheet {
  id: string
  title: string
  trackIds: string[]
  createdAt: number
}

export interface LyricLine {
  time: number
  text: string
}
