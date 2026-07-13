import { makeAutoObservable, runInAction } from 'mobx'

export interface AiChatProvidersApi {
  providers: tinker.AiProviderInfo[]
  ensureLoaded(): Promise<void>
}

let loadPromise: Promise<void> | null = null

class AiChatProvidersStore implements AiChatProvidersApi {
  providers: tinker.AiProviderInfo[] = []
  loaded = false

  constructor() {
    makeAutoObservable(this)
  }

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    if (!loadPromise) {
      loadPromise = this.fetchProviders()
    }
    await loadPromise
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
