import fs from 'fs-extra'
import dateFormat from 'licia/dateFormat'
import types from 'licia/types'
import { t } from 'common/util'
import { IPlugin } from 'common/types'
import { zipFiles, unzipFiles } from './util'
import mainObj from '../main'

export async function saveData(
  files: types.PlainObj<string | Uint8Array>,
  plugin?: IPlugin | null,
  filePath?: string
): Promise<string | undefined> {
  const buf = zipFiles(files)
  if (!filePath) {
    const result = await mainObj.showSaveDialog({
      title: t('exportData'),
      defaultPath: plugin
        ? `${plugin.id}-${dateFormat('yyyymmdd')}.zip`
        : 'tinker-data.zip',
      filters: [{ name: 'Zip Files', extensions: ['zip'] }],
    })
    filePath = result.filePath
  }
  if (!filePath) {
    return
  }
  await fs.writeFile(filePath, buf)
  return filePath
}

export async function loadData(
  plugin?: IPlugin | null,
  filePath?: string
): Promise<types.PlainObj<string | Uint8Array> | undefined> {
  const skipDialog = !!filePath
  if (!filePath) {
    const { filePaths } = await mainObj.showOpenDialog({
      title: t('importData'),
      properties: ['openFile'],
      filters: [{ name: 'Zip Files', extensions: ['zip'] }],
    })
    if (!filePaths || filePaths.length === 0) {
      return
    }
    filePath = filePaths[0]
  }
  const buf = await fs.readFile(filePath)
  const files = unzipFiles(buf)
  const pluginData = files['plugin.json']
  if (pluginData) {
    const meta = JSON.parse(pluginData as string)
    if (plugin && meta.id !== plugin.id) {
      const message = t('importDataMismatchErr', {
        expected: plugin.id,
        got: meta.id,
      })
      if (skipDialog) {
        throw new Error(message)
      }
      alert(message)
      return
    }
  }
  return files
}
