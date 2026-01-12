import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from './store'
import InputFields from './components/InputFields'
import PasswordSettings from './components/PasswordSettings'
import CharacterTypesTable from './components/CharacterTypesTable'
import GeneratedPassword from './components/GeneratedPassword'

export default observer(function App() {
  // Auto-generate on input change
  const handleInputChange = () => {
    if (store.phrase && store.service) {
      try {
        store.generatePassword()
      } catch (error) {
        console.error('Failed to generate password:', error)
      }
    } else {
      // Clear password if either field is empty
      store.generatedPassword = ''
    }
  }

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.secondary} ${tw.bg.dark.secondary} transition-colors`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <InputFields onInputChange={handleInputChange} />
          <PasswordSettings onInputChange={handleInputChange} />
          <CharacterTypesTable onInputChange={handleInputChange} />
          <GeneratedPassword />
        </div>
      </div>
    </div>
  )
})
