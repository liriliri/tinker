declare global {
  const tinker: {
    getTheme(): Promise<string>
    getLanguage(): Promise<string>
    on(event: string, callback: (...args: any[]) => void): () => void
  }
}

export {}
