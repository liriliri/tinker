import { defineConfig, UserConfig } from 'vite'

export default defineConfig(async (): Promise<UserConfig> => {
  const cwd = process.cwd()

  return {
    root: cwd,
  }
})
