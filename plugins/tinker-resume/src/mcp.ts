import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { isResumeData } from './lib/util'
import type { ResumeData, TemplateId } from './types'
import type { Store } from './store'
import pkg from '../package.json'

interface SetArgs {
  resume?: ResumeData
  templateId?: TemplateId
  themeColor?: string
}

interface ExportPdfArgs {
  path: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get,
    set,
    export_pdf: exportPdf,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set':
      return JSON.stringify(args.resume ?? args)
    case 'export_pdf':
      return (args.path as string) || ''
    default:
      return ''
  }
}

function get(store: Store) {
  return {
    resume: store.resume,
    templateId: store.templateId,
    themeColor: store.themeColor,
  }
}

function set(store: Store, args: SetArgs) {
  if (
    args.resume === undefined &&
    args.templateId === undefined &&
    args.themeColor === undefined
  ) {
    throw new Error('Provide resume, templateId, or themeColor.')
  }

  if (args.resume !== undefined) {
    if (!isResumeData(args.resume)) {
      throw new Error('Invalid resume data.')
    }
    store.setResume(args.resume)
  }

  if (args.templateId !== undefined) {
    store.setTemplateId(args.templateId)
  }

  if (args.themeColor !== undefined) {
    store.setThemeColor(args.themeColor)
  }

  return get(store)
}

async function exportPdf(store: Store, args: ExportPdfArgs) {
  const path = await store.exportPdf(args.path)
  if (!path) {
    throw new Error('Failed to export PDF.')
  }
  return {
    path,
    ...get(store),
  }
}
