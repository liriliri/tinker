import TitleBar from './components/TitleBar'
import PluginList from './components/PluginList'
import { useCheckUpdate } from 'share/renderer/lib/hooks'

export default function App() {
  useCheckUpdate('https://tinker.liriliri.io')

  return (
    <>
      <TitleBar />
      <PluginList />
    </>
  )
}
