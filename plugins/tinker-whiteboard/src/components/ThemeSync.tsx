import { useEffect } from 'react'
import { useEditor } from 'tldraw'
import { observer } from 'mobx-react-lite'
import store from '../store'

export default observer(function ThemeSync() {
  const editor = useEditor()

  useEffect(() => {
    const isDark = store.isDark
    editor.user.updateUserPreferences({
      colorScheme: isDark ? 'dark' : 'light',
    })
  }, [editor, store.isDark])

  return null
})
