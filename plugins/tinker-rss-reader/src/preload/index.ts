import { contextBridge, shell } from 'electron'
import Parser from 'rss-parser'
import MercuryParser from '@postlight/parser'
import type { ParsedItem } from '../common/types'

const rssParser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'fullContent'],
      ['media:content', 'mediaContent', { keepArray: true }],
    ],
  },
})

type ParserItem = Parser.Item & {
  fullContent?: string
  mediaContent?: Array<{ $?: { medium?: string; url?: string } }>
}

function extractThumb(item: ParserItem, content: string): string {
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url
  }
  if (item.mediaContent) {
    const img = item.mediaContent.find(
      (c) => c.$?.medium === 'image' && c.$?.url
    )
    if (img?.$?.url) return img.$.url
  }
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : ''
}

function parseItems(items: ParserItem[]): ParsedItem[] {
  return items.map((item) => {
    const content = item.fullContent || item.content || item.summary || ''
    const snippet = (item.contentSnippet || content.replace(/<[^>]*>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200)
    return {
      title: item.title || 'Untitled',
      link: item.link || item.guid || '',
      date:
        new Date(item.isoDate ?? item.pubDate ?? '').getTime() || Date.now(),
      content,
      snippet,
      thumb: extractThumb(item, content),
      creator: item.creator || '',
    }
  })
}

const rssReaderObj = {
  async fetchFeed(
    url: string
  ): Promise<{ title?: string; items?: ParsedItem[]; error?: string }> {
    try {
      const feed = await rssParser.parseURL(url)
      return {
        title: feed.title,
        items: parseItems(feed.items as ParserItem[]),
      }
    } catch (err) {
      return { error: (err as Error).message }
    }
  },

  openExternal(url: string): void {
    shell.openExternal(url)
  },

  async fetchFullContent(
    url: string
  ): Promise<{ content?: string; error?: string }> {
    try {
      const html = await fetch(url).then((r) => r.text())
      const result = await MercuryParser.parse(url, { html })
      return { content: result.content || '' }
    } catch (err) {
      return { error: (err as Error).message }
    }
  },
}

contextBridge.exposeInMainWorld('rssReader', rssReaderObj)

declare global {
  const rssReader: typeof rssReaderObj
}
