import { makeAutoObservable, runInAction } from 'mobx'

export interface AiChatProvidersApi {
  providers: tinker.AiProviderInfo[]
  ensureLoaded(): Promise<void>
}

class AiChatProvidersStore implements AiChatProvidersApi {
  providers: tinker.AiProviderInfo[] = []
  private loadPromise: Promise<void> | null = null
  loaded = false

  constructor() {
    makeAutoObservable(this, { loadPromise: false })
  }

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    if (!this.loadPromise) {
      this.loadPromise = this.fetchProviders()
    }
    await this.loadPromise
  }

  private async fetchProviders() {
    const providers = await tinker.getAIProviders()
    runInAction(() => {
      this.providers = providers
      this.loaded = true
    })
  }
}

export default new AiChatProvidersStore()
