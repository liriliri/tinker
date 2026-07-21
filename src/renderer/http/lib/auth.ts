import SessionStore from 'licia/SessionStore'
import btoa from 'licia/btoa'
import utf8 from 'licia/utf8'
import isStr from 'licia/isStr'
import Url from 'licia/Url'

export interface BasicCredentials {
  username: string
  password: string
}

const storage = new SessionStore('tinker-http-auth')

export function loadCredentials(): BasicCredentials | null {
  const username = storage.get('username')
  const password = storage.get('password')
  if (!isStr(username) || !isStr(password)) {
    return null
  }
  return { username, password }
}

export function saveCredentials(creds: BasicCredentials) {
  storage.set(creds)
}

export function clearCredentials() {
  storage.clear()
}

export function authorizationHeader(creds: BasicCredentials) {
  return `Basic ${btoa(utf8.encode(`${creds.username}:${creds.password}`))}`
}

export async function apiFetch(
  input: string,
  init: RequestInit = {},
  creds?: BasicCredentials | null
) {
  const headers = new Headers(init.headers || {})
  if (creds) {
    headers.set('Authorization', authorizationHeader(creds))
  }
  return fetch(input, { ...init, headers })
}

export function wsUrl(path: string, creds?: BasicCredentials | null) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = new Url(`${protocol}//${location.host}${path}`)
  if (creds) {
    url.setQuery('authorization', authorizationHeader(creds))
  }
  return url.toString()
}
