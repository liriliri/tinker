import { makeAutoObservable } from 'mobx'
import type AiChatStore from 'share/store/AiChat'

class Browser {
  id: string
  url = ''
  title = ''
  favicon = ''
  isLoading = false
  canGoBack = false
  canGoForward = false
  chatOpen = false
  chat!: AiChatStore

  constructor(id: string, url = '') {
    this.id = id
    this.url = url
    makeAutoObservable(this, { chat: false })
  }

  updateTitle(title: string) {
    this.title = title
  }

  updateFavicon(favicon: string) {
    this.favicon = favicon
  }

  updateLoading(isLoading: boolean) {
    this.isLoading = isLoading
  }

  updateUrl(url: string) {
    this.url = url
  }

  updateNavState(canGoBack: boolean, canGoForward: boolean) {
    this.canGoBack = canGoBack
    this.canGoForward = canGoForward
  }
}

export default Browser
