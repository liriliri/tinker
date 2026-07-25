import endWith from 'licia/endWith'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import some from 'licia/some'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../../package.json'

interface OpenArgs {
  path: string
}

interface CreateArgs {
  path: string
}

interface ListArgs {
  path?: string
}

interface AddArgs {
  paths: string[]
  dest?: string
}

interface MkdirArgs {
  path: string
}

interface DeleteArgs {
  paths: string[]
}

interface ExtractArgs {
  dest: string
  paths?: string[]
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openArchive,
    create: createArchive,
    list,
    add: addFiles,
    mkdir: createFolder,
    delete: deleteEntries,
    extract,
  })
}

function requireOpen(store: Store) {
  if (!store.isOpen) {
    throw new Error('No archive is open. Call open or create first.')
  }
}

function serialize(store: Store) {
  return {
    archivePath: store.archivePath,
    archiveName: store.archiveName,
    currentPath: store.currentPath,
    entries: store.sortedEntries,
    entryCount: store.entries.length,
  }
}

function normalizeDirPath(dirPath: string): string {
  const value = trim(dirPath).replace(/\\/g, '/')
  if (!value || value === '/') return ''
  return endWith(value, '/') ? value : `${value}/`
}

async function openArchive(store: Store, args: OpenArgs) {
  if (!(await fileExists(args.path))) {
    throw new Error(`Archive not found: ${args.path}`)
  }
  if (!endWith(lowerCase(args.path), '.zip')) {
    throw new Error('Only .zip archives are supported.')
  }

  const ok = await store.openArchivePath(args.path)
  if (!ok) {
    throw new Error(`Failed to open archive: ${args.path}`)
  }

  return serialize(store)
}

async function createArchive(store: Store, args: CreateArgs) {
  const ok = await store.createArchive(args.path)
  if (!ok) {
    throw new Error(`Failed to create archive: ${args.path}`)
  }

  return serialize(store)
}

async function list(store: Store, args: ListArgs) {
  requireOpen(store)

  if (args.path !== undefined) {
    const dirPath = normalizeDirPath(args.path)
    if (dirPath) {
      const parent = archive.dirname(dirPath)
      const siblings = archive.listDir(parent)
      const found = some(
        siblings,
        (entry) => entry.isDirectory && entry.path === dirPath
      )
      if (!found && !archive.entryExists(dirPath)) {
        throw new Error(`Directory not found in archive: ${dirPath}`)
      }
    }
    await store.navigate(dirPath)
    if (store.error) {
      throw new Error(store.error)
    }
  } else {
    await store.refresh()
    if (store.error) {
      throw new Error(store.error)
    }
  }

  return serialize(store)
}

async function addFiles(store: Store, args: AddArgs) {
  requireOpen(store)

  for (const filePath of args.paths) {
    if (!(await fileExists(filePath))) {
      throw new Error(`File or folder not found: ${filePath}`)
    }
  }

  const dest = args.dest !== undefined ? normalizeDirPath(args.dest) : undefined
  const ok = await store.addFiles(args.paths, dest)
  if (!ok) {
    throw new Error('Failed to add files to archive.')
  }

  return serialize(store)
}

async function createFolder(store: Store, args: MkdirArgs) {
  requireOpen(store)

  const ok = await store.createFolderAt(normalizeDirPath(args.path))
  if (!ok) {
    throw new Error(`Failed to create folder: ${args.path}`)
  }

  return serialize(store)
}

async function deleteEntries(store: Store, args: DeleteArgs) {
  requireOpen(store)

  const ok = await store.deleteEntries(args.paths)
  if (!ok) {
    throw new Error('Failed to delete entries from archive.')
  }

  return serialize(store)
}

async function extract(store: Store, args: ExtractArgs) {
  requireOpen(store)

  const paths = args.paths
  const ok =
    !paths || isEmpty(paths)
      ? await store.extractAll(args.dest)
      : await store.extractEntries(paths, args.dest)

  if (!ok) {
    throw new Error('Failed to extract archive entries.')
  }

  return {
    dest: args.dest,
    paths: paths && !isEmpty(paths) ? paths : null,
    extractedAll: !paths || isEmpty(paths),
    ...serialize(store),
  }
}
