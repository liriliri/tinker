import Koa from 'koa'
import Router from '@koa/router'
import serve from 'koa-static'
import keys from 'licia/keys'
import map from 'licia/map'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import { pluginViews } from '../plugin/view'
import { plugins } from '../plugin/loader'
import { isDev } from 'share/common/util'
import { getTheme } from 'share/main/lib/util'
import * as language from 'share/main/lib/language'
import { getRendererRoot, loadAppHtml } from './static'
import { checkBasicAuth, HttpAuth } from './auth'

function listRunningPlugins() {
  return map(keys(pluginViews), (id) => ({
    id,
    name: plugins[id]?.name || id,
  }))
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

  router.get('/api/plugins', (ctx) => {
    ctx.set('Cache-Control', 'no-cache')
    ctx.body = listRunningPlugins()
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
