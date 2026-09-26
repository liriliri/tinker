import TitleBar from './components/TitleBar'
import CategoryTabs from './components/CategoryTabs'
import PluginList from './components/PluginList'
import { useCheckUpdate } from 'share/renderer/lib/hooks'

export default function App() {
  useCheckUpdate('https://tinker.liriliri.io')

  return (
    <>
      <TitleBar />
      <PluginList />
      <CategoryTabs />
    </>
  )
}
