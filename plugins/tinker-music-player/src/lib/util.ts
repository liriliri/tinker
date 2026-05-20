export const AUDIO_DIALOG_OPTIONS = {
  properties: ['openFile', 'multiSelections'] as (
    | 'openFile'
    | 'multiSelections'
  )[],
  filters: [
    {
      name: 'Audio Files',
      extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'wma'],
    },
  ],
}
