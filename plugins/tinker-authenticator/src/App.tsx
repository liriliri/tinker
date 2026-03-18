import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import Toolbar from './components/Toolbar'
import AccountCard from './components/AccountCard'
import AddDialog from './components/AddDialog'
import ImportDialog from './components/ImportDialog'
import LockScreen from './components/LockScreen'
import PasswordDialog from './components/PasswordDialog'
import QRDialog from './components/QRDialog'

export default observer(function App() {
  const { t, i18n } = useTranslation()
  const accounts = store.filteredAccounts

  return (
    <ConfirmProvider locale={i18n.language}>
      <ToasterProvider>
        {store.isLocked ? (
          <LockScreen />
        ) : (
          <div
            className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
          >
            <Toolbar />

            <div className="flex-1 overflow-y-auto p-3">
              {accounts.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center h-full gap-2 ${tw.text.tertiary}`}
                >
                  <Lock size={40} />
                  <p className="text-sm">
                    {store.searchQuery ? t('noResults') : t('emptyHint')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </div>

            <AddDialog />
            <ImportDialog />
            <PasswordDialog />
            <QRDialog />
          </div>
        )}
      </ToasterProvider>
    </ConfirmProvider>
  )
})
