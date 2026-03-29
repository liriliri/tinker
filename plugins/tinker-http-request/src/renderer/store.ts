import { makeAutoObservable, runInAction } from 'mobx'
import jsonClone from 'licia/jsonClone'
import BaseStore from 'share/BaseStore'
import type {
  HttpMethod,
  KeyValuePair,
  BodyType,
  AuthType,
  HttpResponse,
  RequestConfig,
} from '../common/types'

type RequestTab = 'params' | 'headers' | 'body' | 'auth'
type ResponseTab = 'body' | 'headers'

class Store extends BaseStore {
  method: HttpMethod = 'GET'
  url: string = ''
  headers: KeyValuePair[] = [{ key: '', value: '', enabled: true }]
  params: KeyValuePair[] = [{ key: '', value: '', enabled: true }]
  bodyType: BodyType = 'none'
  body: string = ''
  formData: KeyValuePair[] = [{ key: '', value: '', enabled: true }]
  authType: AuthType = 'none'
  authBasicUser: string = ''
  authBasicPass: string = ''
  authBearerToken: string = ''

  response: HttpResponse | null = null
  loading: boolean = false
  activeRequestTab: RequestTab = 'params'
  activeResponseTab: ResponseTab = 'body'

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setMethod(method: HttpMethod) {
    this.method = method
  }

  setUrl(url: string) {
    this.url = url
  }

  setBodyType(bodyType: BodyType) {
    this.bodyType = bodyType
  }

  setBody(body: string) {
    this.body = body
  }

  setAuthType(authType: AuthType) {
    this.authType = authType
  }

  setAuthBasicUser(user: string) {
    this.authBasicUser = user
  }

  setAuthBasicPass(pass: string) {
    this.authBasicPass = pass
  }

  setAuthBearerToken(token: string) {
    this.authBearerToken = token
  }

  setActiveRequestTab(tab: RequestTab) {
    this.activeRequestTab = tab
  }

  setActiveResponseTab(tab: ResponseTab) {
    this.activeResponseTab = tab
  }

  updatePair(
    list: 'headers' | 'params' | 'formData',
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) {
    const item = this[list][index]
    if (field === 'enabled') {
      item.enabled = value as boolean
    } else {
      item[field] = value as string
    }
  }

  addPair(list: 'headers' | 'params' | 'formData') {
    this[list].push({ key: '', value: '', enabled: true })
  }

  removePair(list: 'headers' | 'params' | 'formData', index: number) {
    this[list].splice(index, 1)
    if (this[list].length === 0) {
      this[list].push({ key: '', value: '', enabled: true })
    }
  }

  getRequestConfig(): RequestConfig {
    return jsonClone({
      method: this.method,
      url: this.url,
      headers: this.headers,
      params: this.params,
      bodyType: this.bodyType,
      body: this.body,
      formData: this.formData,
      authType: this.authType,
      authBasicUser: this.authBasicUser,
      authBasicPass: this.authBasicPass,
      authBearerToken: this.authBearerToken,
    })
  }

  async send() {
    if (this.loading || !this.url.trim()) return
    this.loading = true
    this.response = null

    try {
      const result = await httpRequest.send(this.getRequestConfig())
      runInAction(() => {
        this.response = result
        this.loading = false
      })
    } catch (err) {
      runInAction(() => {
        this.response = {
          status: 0,
          statusText: '',
          headers: {},
          body: '',
          duration: 0,
          size: 0,
          error: err instanceof Error ? err.message : String(err),
        }
        this.loading = false
      })
    }
  }

  abort() {
    httpRequest.abort()
    this.loading = false
  }
}

export default new Store()
