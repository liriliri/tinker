import isWindows from 'licia/isWindows'
import naturalSort from 'licia/naturalSort'
import { fileExists } from 'share/lib/util'
import type { ConfigFile } from '../types'

const HOSTS_PATH = isWindows
  ? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
  : '/etc/hosts'

async function resolvePath(candidate: ConfigFile): Promise<ConfigFile | null> {
  const paths = candidate.paths ?? [candidate.path]
  for (const p of paths) {
    if (await fileExists(p)) {
      return { ...candidate, path: p }
    }
  }
  return null
}

export async function getConfigFiles(): Promise<ConfigFile[]> {
  const home = await tinker.getPath('home')
  const candidates: ConfigFile[] = [
    { name: 'hosts', path: HOSTS_PATH, language: 'plaintext' },
    { name: 'npm', path: `${home}/.npmrc`, language: 'ini' },
    { name: 'codex', path: `${home}/.codex/config.toml`, language: 'ini' },
    { name: 'claude', path: `${home}/.claude/settings.json`, language: 'json' },
    {
      name: 'gradle',
      path: `${home}/.gradle/gradle.properties`,
      language: 'ini',
    },
    { name: 'gitconfig', path: `${home}/.gitconfig`, language: 'ini' },
    ...(isWindows
      ? []
      : [
          { name: 'bash', path: `${home}/.bashrc`, language: 'shell' },
          { name: 'zsh', path: `${home}/.zshrc`, language: 'shell' },
          {
            name: 'sshdConfig',
            path: '/etc/ssh/sshd_config',
            language: 'shell',
          },
          {
            name: 'nginxConfig',
            paths: [
              '/etc/nginx/nginx.conf',
              '/opt/homebrew/etc/nginx/nginx.conf',
            ],
            path: '',
            language: 'shell',
          },
        ]),
  ]

  const resolved = await Promise.all(candidates.map(resolvePath))
  const files = resolved.filter((f): f is ConfigFile => f !== null)
  const fileMap = new Map(files.map((f) => [f.name, f]))
  const names = naturalSort(files.map((f) => f.name))
  return names.map((name) => fileMap.get(name)!)
}
