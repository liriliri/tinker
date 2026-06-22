import { IMAGE_EXTS } from 'share/lib/fileType'

export const IMAGE_DIALOG_OPTIONS = {
  title: 'Open Image',
  filters: [
    {
      name: 'Images',
      extensions: [...IMAGE_EXTS],
    },
  ],
  properties: ['openFile', 'multiSelections'] as (
    | 'openFile'
    | 'multiSelections'
  )[],
}
