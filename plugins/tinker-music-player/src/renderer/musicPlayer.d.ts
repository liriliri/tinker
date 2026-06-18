declare global {
  const musicPlayer: {
    scanAudioFiles(dirs: string[]): Promise<string[]>
  }
}

export {}
