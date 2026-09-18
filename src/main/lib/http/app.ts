import Koa from 'koa'
import Router from '@koa/router'
import serve from 'koa-static'
import keys from 'licia/keys'
import map from 'licia/map'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import filter from 'licia/filter'
import { openPlugin, closePlugin, pluginViews } from '../plugin/view'
import { getPlugins, plugins } from '../plugin/loader'
import { getMainStore } from '../store'
import { isDev } from 'share/common/util'
import { getTheme } from 'share/main/lib/util'
import * as language from 'share/main/lib/language'
import { getRendererRoot, loadAppHtml } from './static'
import { checkBasicAuth, HttpAuth } from './auth'

async function listPlugins() {
  await getPlugins()
  const pluginStates = getMainStore().get('pluginStates') || {}
  const items = map(
    filter(keys(plugins), (id) => !pluginStates[id]?.hidden),
    (id) => ({
      id,
      name: plugins[id]?.name || id,
      running: !!pluginViews[id],
    })
  )

  return items.sort((a, b) => {
    if (a.running !== b.running) {
      return a.running ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

async function sendAppHtml(ctx: Koa.Context) {
  try {
    ctx.type = 'html'
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = await loadAppHtml()
  } catch (err: any) {
    ctx.status = 503
    ctx.body = err?.message || String(err)
  }
}

const publicPaths = [
  '/',
  '/index.html',
  '/api/auth',
  '/api/theme',
  '/api/language',
]

function isPublicPath(path: string) {
  return contain(publicPaths, path) || startWith(path, '/p/')
}

export function createApp(auth?: HttpAuth) {
  const app = new Koa()
  const router = new Router()

  if (auth) {
    app.use(async (ctx, next) => {
      if (isPublicPath(ctx.path)) {
        await next()
        return
      }
      // Static assets (prod) stay public so the login UI can load.
      if (ctx.method === 'GET' && !startWith(ctx.path, '/api/')) {
        await next()
        return
      }
      if (!checkBasicAuth(ctx.get('authorization'), auth)) {
        // No WWW-Authenticate header — avoid the browser's native Basic dialog.
        ctx.status = 401
        ctx.body = { error: 'Unauthorized' }
        return
      }
      await next()
    })
  }

  router.get('/api/auth', (ctx) => {
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = { required: !!auth }
  })

  router.get('/api/plugins', async (ctx) => {
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = await listPlugins()
  })

  router.post('/api/plugins/:id/open', async (ctx) => {
    await getPlugins()
    const id = ctx.params.id
    if (!plugins[id]) {
      ctx.status = 404
      ctx.body = { error: 'Plugin not found' }
      return
    }
    openPlugin(id)
    ctx.body = {
      id,
      name: plugins[id].name || id,
      running: true,
    }
  })

  router.post('/api/plugins/:id/close', async (ctx) => {
    const id = ctx.params.id
    if (!pluginViews[id]) {
      ctx.status = 404
      ctx.body = { error: 'Plugin is not running' }
      return
    }
    await closePlugin(id, true)
    ctx.body = {
      id,
      name: plugins[id]?.name || id,
      running: false,
    }
  })

  router.get('/api/theme', (ctx) => {
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = { theme: getTheme() }
  })

  router.get('/api/language', (ctx) => {
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = { language: language.get() }
  })

  router.get(['/', '/index.html'], sendAppHtml)

  router.get('/p/:id', async (ctx) => {
    if (!pluginViews[ctx.params.id]) {
      ctx.redirect('/')
      return
    }
    await sendAppHtml(ctx)
  })

  app.use(router.routes())
  app.use(router.allowedMethods())

  if (!isDev()) {
    app.use(serve(getRendererRoot(), { index: false }))
  }

  return app
}
