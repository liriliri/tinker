import { AUDIO_EXTS } from 'share/lib/fileType'

export const AUDIO_DIALOG_OPTIONS = {
  properties: ['openFile', 'multiSelections'] as (
    | 'openFile'
    | 'multiSelections'
  )[],
  filters: [
    {
      name: 'Audio Files',
      extensions: [...AUDIO_EXTS],
    },
  ],
}
