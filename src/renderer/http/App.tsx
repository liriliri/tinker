import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
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
        <header className={Style.header}>
          <h1>{t('remote')}</h1>
        </header>
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
      <header className={Style.header}>
        <h1>{t('remote')}</h1>
      </header>
      {store.error ? <div className={Style.error}>{store.error}</div> : null}
      {store.plugins.length === 0 && !store.error ? (
        <div className={Style.empty}>{t('noRunningPlugins')}</div>
      ) : (
        <ul className={Style.list}>
          {store.plugins.map((plugin) => (
            <li key={plugin.id}>
              <a href={`/p/${encodeURIComponent(plugin.id)}`}>
                <span className={Style.name}>{plugin.name}</span>
                <span className={Style.id}>{plugin.id}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
