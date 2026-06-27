import { confirm } from 'share/components/Confirm'
import store from '../store'

export function buildEntryContextMenuHandlers(
  tabId: string,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  return {
    onDownload: () => void store.promptDownloadSelected(tabId),
    onRename: (path: string, newName: string) =>
      store.renameEntry(tabId, path, newName),
    onDelete: (paths: string[]) =>
      void confirmAndDeleteEntries(tabId, paths, t),
  }
}

async function confirmAndDeleteEntries(
  tabId: string,
  paths: string[],
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const ok = await confirm({
    title: t('delete'),
    message: t('deleteConfirm', {
      name: paths.map((p) => sftp.basename(p)).join(', '),
    }),
  })
  if (ok) {
    await store.deleteEntries(tabId, paths)
  }
}
