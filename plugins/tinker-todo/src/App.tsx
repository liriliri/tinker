import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import AddTodo from './components/AddTodo'
import TodoItem from './components/TodoItem'
import Welcome from './components/Welcome'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  if (store.needsFileSelection) {
    return (
      <AlertProvider locale={i18n.language}>
        <ConfirmProvider locale={i18n.language}>
          <Welcome
            onOpenFile={() => store.openExistingFile()}
            onCreateFile={() => store.createNewFile()}
          />
        </ConfirmProvider>
      </AlertProvider>
    )
  }

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <ToasterProvider>
          <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
            <Toolbar />

            <div className="flex-1 flex overflow-hidden">
              <Sidebar />

              <div className="flex-1 flex flex-col min-w-0">
                <AddTodo />

                <div className="flex-1 overflow-y-auto p-4">
                  {store.filteredTodos.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <CheckCircle2
                          size={48}
                          className={`mx-auto ${tw.text.both.secondary} opacity-30 mb-3`}
                        />
                        <p className={`text-sm ${tw.text.both.secondary}`}>
                          {store.searchQuery
                            ? t('noSearchResults')
                            : t('noTasks')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {store.filteredTodos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
