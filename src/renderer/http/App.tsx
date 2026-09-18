import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import LunaScrollbar from 'luna-scrollbar/react'
import { t } from 'common/util'
import Style from './App.module.scss'
import Screencast from './components/Screencast'
import store from './store'

export default observer(function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => store.dispose()
  }, [])

  if (!store.authReady) {
    return null
  }

  if (store.needsLogin) {
    return (
      <div className={Style.page}>
        <form
          className={Style.login}
          onSubmit={async (event) => {
            event.preventDefault()
            setSubmitting(true)
            try {
              await store.login(username, password)
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <label className={Style.field}>
            <span>{t('username')}</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
            />
          </label>
          <label className={Style.field}>
            <span>{t('password')}</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {store.authError ? (
            <div className={Style.error}>{store.authError}</div>
          ) : null}
          <button
            className={Style.loginBtn}
            type="submit"
            disabled={submitting}
          >
            {t('login')}
          </button>
        </form>
      </div>
    )
  }

  if (store.pluginId) {
    return <Screencast pluginId={store.pluginId} />
  }

  return (
    <div className={Style.page}>
      <div className={Style.search}>
        <input
          type="search"
          placeholder={t('searchTool')}
          value={store.filter}
          autoFocus
          onChange={(event) => store.setFilter(event.target.value)}
        />
      </div>
      <div className={Style.content}>
        <LunaScrollbar className={Style.scrollbar}>
          {store.error ? (
            <div className={Style.error}>{store.error}</div>
          ) : null}
          {store.plugins.length === 0 && !store.error ? (
            <div className={Style.empty}>{t('noPlugins')}</div>
          ) : store.filteredPlugins.length === 0 ? (
            <div className={Style.empty}>{t('noResult')}</div>
          ) : (
            <ul className={Style.list}>
              {store.filteredPlugins.map((plugin) => {
                const opening = store.openingId === plugin.id
                const closing = store.closingId === plugin.id
                return (
                  <li key={plugin.id} className={Style.row}>
                    <button
                      type="button"
                      className={Style.item}
                      disabled={store.busy}
                      onClick={() => store.openPlugin(plugin)}
                    >
                      <span className={Style.name}>{plugin.name}</span>
                      <span className={Style.meta}>
                        {opening ? (
                          <span className={Style.badge}>{t('opening')}</span>
                        ) : closing ? (
                          <span className={Style.badge}>{t('closing')}</span>
                        ) : plugin.running ? (
                          <span className={Style.badgeRunning}>
                            {t('running')}
                          </span>
                        ) : null}
                        <span className={Style.id}>{plugin.id}</span>
                      </span>
                    </button>
                    {plugin.running ? (
                      <button
                        type="button"
                        className={Style.close}
                        title={t('close')}
                        aria-label={t('close')}
                        disabled={store.busy}
                        onClick={() => store.closePlugin(plugin)}
                      >
                        <span className="icon-close" />
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </LunaScrollbar>
      </div>
    </div>
  )
})
