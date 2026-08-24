import isNum from 'licia/isNum'
import isObj from 'licia/isObj'
import normalizePath from 'licia/normalizePath'
import { storage } from 'share/store/Base'

const STORAGE_PROJECTS = 'projects'

export interface ProjectWindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ProjectData {
  bounds?: ProjectWindowBounds
  sidebarOpen?: boolean
  chatOpen?: boolean
}

function isWindowBounds(value: unknown): value is ProjectWindowBounds {
  if (!isObj(value)) return false
  const bounds = value as ProjectWindowBounds
  return (
    isNum(bounds.x) &&
    isNum(bounds.y) &&
    isNum(bounds.width) &&
    isNum(bounds.height)
  )
}

function getProjects(): Record<string, ProjectData> {
  const existing = storage.get(STORAGE_PROJECTS)
  return isObj(existing) ? { ...(existing as Record<string, ProjectData>) } : {}
}

export function getProjectData(rootPath: string): ProjectData {
  return getProjects()[normalizePath(rootPath)] ?? {}
}

export function setProjectData(rootPath: string, patch: Partial<ProjectData>) {
  const key = normalizePath(rootPath)
  const projects = getProjects()
  projects[key] = { ...projects[key], ...patch }
  storage.set(STORAGE_PROJECTS, projects)
}

export function getSavedWindowBounds(
  rootPath: string
): ProjectWindowBounds | null {
  const bounds = getProjectData(rootPath).bounds
  return isWindowBounds(bounds) ? bounds : null
}

export function saveWindowBounds(rootPath: string) {
  setProjectData(rootPath, {
    bounds: {
      x: window.screenX,
      y: window.screenY,
      width: window.outerWidth,
      height: window.outerHeight,
    },
  })
}
