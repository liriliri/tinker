export interface ParsedItem {
  title: string
  link: string
  date: number
  content: string
  snippet: string
  thumb: string
  creator: string
}

export interface RSSSource {
  id: string
  url: string
  name: string
  iconUrl: string
  lastFetched: number
  unreadCount: number
}

export interface RSSItem {
  id: string
  sourceId: string
  title: string
  link: string
  date: number
  content: string
  snippet: string
  thumb: string
  creator: string
  hasRead: boolean
}
