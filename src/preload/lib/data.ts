import fs from 'fs-extra'
import dateFormat from 'licia/dateFormat'
import types from 'licia/types'
import { t } from 'common/util'
import { IPlugin } from 'common/types'
import { zipFiles, unzipFiles } from './util'
import mainObj from '../main'

export async function saveData(
  files: types.PlainObj<string>,
  plugin?: IPlugin | null
) {
  const buf = zipFiles(files)
  const { filePath } = await mainObj.showSaveDialog({
    title: t('exportData'),
    defaultPath: plugin
      ? `${plugin.id}-${dateFormat('yyyymmdd')}.zip`
      : 'tinker-data.zip',
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
  })
  if (filePath) {
    await fs.writeFile(filePath, buf)
  }
}

export async function loadData(
  plugin?: IPlugin | null
): Promise<types.PlainObj<string> | undefined> {
  const { filePaths } = await mainObj.showOpenDialog({
    title: t('importData'),
    properties: ['openFile'],
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
  })
  if (filePaths && filePaths.length > 0) {
    const result = confirm(t('importDataConfirm'))
    if (!result) {
      return
    }
    const filePath = filePaths[0]
    const buf = await fs.readFile(filePath)
    const files = unzipFiles(buf)
    const pluginData = files['plugin.json']
    if (pluginData) {
      const meta = JSON.parse(pluginData)
      if (plugin && meta.id !== plugin.id) {
        alert(
          t('importDataMismatchErr', {
            expected: plugin.id,
            got: meta.id,
          })
        )
        return
      }
    }
    return files
  }
}
