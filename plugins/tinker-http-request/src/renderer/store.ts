import { makeAutoObservable, runInAction } from 'mobx'
import jsonClone from 'licia/jsonClone'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import * as db from '../lib/db'
import type {
  HttpMethod,
  KeyValuePair,
  BodyType,
  AuthType,
  HttpResponse,
  RequestConfig,
  Collection,
  CollectionItem,
} from '../common/types'

type RequestTab = 'params' | 'headers' | 'body' | 'auth'
type ResponseTab = 'body' | 'headers'

function getDefaultRequestConfig(): RequestConfig {
  return {
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    params: [{ key: '', value: '', enabled: true }],
    bodyType: 'none',
    body: '',
    formData: [{ key: '', value: '', enabled: true }],
    authType: 'none',
    authBasicUser: '',
    authBasicPass: '',
    authBearerToken: '',
  }
}

function findItemInCollections(
  collections: Collection[],
  itemId: string
): CollectionItem | null {
  for (const collection of collections) {
    const found = findItemInItems(collection.items, itemId)
    if (found) return found
  }
  return null
}

function findItemInItems(
  items: CollectionItem[],
  itemId: string
): CollectionItem | null {
  for (const item of items) {
    if (item.id === itemId) return item
    if (item.children) {
      const found = findItemInItems(item.children, itemId)
      if (found) return found
    }
  }
  return null
}

function findParentItems(
  collections: Collection[],
  itemId: string
): CollectionItem[] | null {
  for (const collection of collections) {
    if (collection.items.some((item) => item.id === itemId)) {
      return collection.items
    }
    const found = findParentInItems(collection.items, itemId)
    if (found) return found
  }
  return null
}

function findParentInItems(
  items: CollectionItem[],
  itemId: string
): CollectionItem[] | null {
  for (const item of items) {
    if (item.children) {
      if (item.children.some((child) => child.id === itemId)) {
        return item.children
      }
      const found = findParentInItems(item.children, itemId)
      if (found) return found
    }
  }
  return null
}

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

  collections: Collection[] = []
  selectedItemId: string | null = null

  private syncing = false
  private savedSnapshot: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadCollections()
  }

  get isTemporary(): boolean {
    return this.selectedItemId === null
  }

  get isDirty(): boolean {
    if (this.isTemporary) return false
    return this.requestSnapshot !== this.savedSnapshot
  }

  private get requestSnapshot(): string {
    return JSON.stringify({
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

  private async loadCollections() {
    try {
      const collections = await db.getAllCollections()
      runInAction(() => {
        this.collections = collections
      })
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  private saveCollections() {
    db.saveAllCollections(jsonClone(this.collections))
  }

  private loadRequestConfig(config: RequestConfig) {
    this.method = config.method
    this.url = config.url
    this.headers = jsonClone(config.headers)
    this.params = jsonClone(config.params)
    this.bodyType = config.bodyType
    this.body = config.body
    this.formData = jsonClone(config.formData)
    this.authType = config.authType
    this.authBasicUser = config.authBasicUser
    this.authBasicPass = config.authBasicPass
    this.authBearerToken = config.authBearerToken
    this.savedSnapshot = JSON.stringify(config)
  }

  private saveCurrentToSelected() {
    if (!this.selectedItemId) return
    const item = findItemInCollections(this.collections, this.selectedItemId)
    if (item && item.type === 'request') {
      item.request = this.getRequestConfig()
      this.saveCollections()
    }
  }

  selectItem(id: string | null) {
    // Auto-save current request before switching
    if (this.selectedItemId && this.selectedItemId !== id) {
      this.saveCurrentToSelected()
    }

    this.selectedItemId = id
    this.response = null

    if (id) {
      const item = findItemInCollections(this.collections, id)
      if (item && item.type === 'request' && item.request) {
        this.loadRequestConfig(item.request)
      }
    } else {
      // Switch to temporary mode with defaults
      const config = getDefaultRequestConfig()
      this.loadRequestConfig(config)
    }
  }

  saveCurrentRequest() {
    this.saveCurrentToSelected()
    this.savedSnapshot = JSON.stringify(this.getRequestConfig())
  }

  // Collection CRUD
  createCollection(name: string) {
    const collection: Collection = {
      id: uuid(),
      name,
      items: [],
    }
    this.collections.push(collection)
    this.saveCollections()
  }

  renameCollection(collectionId: string, name: string) {
    const collection = this.collections.find((c) => c.id === collectionId)
    if (collection) {
      collection.name = name
      this.saveCollections()
    }
  }

  deleteCollection(collectionId: string) {
    const index = this.collections.findIndex((c) => c.id === collectionId)
    if (index !== -1) {
      // Deselect if selected item is in this collection
      if (this.selectedItemId) {
        const item = findItemInItems(
          this.collections[index].items,
          this.selectedItemId
        )
        if (item) {
          this.selectedItemId = null
        }
      }
      this.collections.splice(index, 1)
      this.saveCollections()
    }
  }

  // Folder CRUD
  createFolder(parentId: string, name: string) {
    const folder: CollectionItem = {
      id: uuid(),
      type: 'folder',
      name,
      children: [],
    }
    this.addItemToParent(parentId, folder)
  }

  renameFolder(folderId: string, name: string) {
    const item = findItemInCollections(this.collections, folderId)
    if (item) {
      item.name = name
      this.saveCollections()
    }
  }

  deleteFolder(folderId: string) {
    if (this.selectedItemId) {
      const item = findItemInCollections(this.collections, folderId)
      if (item && item.children) {
        const selectedInFolder = findItemInItems(
          item.children,
          this.selectedItemId
        )
        if (selectedInFolder || this.selectedItemId === folderId) {
          this.selectedItemId = null
        }
      }
    }
    this.removeItem(folderId)
  }

  // Request CRUD
  createRequest(parentId: string, name: string) {
    const request: CollectionItem = {
      id: uuid(),
      type: 'request',
      name,
      request: getDefaultRequestConfig(),
    }
    this.addItemToParent(parentId, request)
    this.selectItem(request.id)
  }

  renameRequest(requestId: string, name: string) {
    const item = findItemInCollections(this.collections, requestId)
    if (item) {
      item.name = name
      this.saveCollections()
    }
  }

  deleteRequest(requestId: string) {
    if (this.selectedItemId === requestId) {
      this.selectedItemId = null
    }
    this.removeItem(requestId)
  }

  private addItemToParent(parentId: string, newItem: CollectionItem) {
    // Check if parentId is a collection
    const collection = this.collections.find((c) => c.id === parentId)
    if (collection) {
      collection.items.push(newItem)
      this.saveCollections()
      return
    }

    // Check if parentId is a folder
    const folder = findItemInCollections(this.collections, parentId)
    if (folder && folder.type === 'folder' && folder.children) {
      folder.children.push(newItem)
      this.saveCollections()
    }
  }

  private removeItem(itemId: string) {
    const parentItems = findParentItems(this.collections, itemId)
    if (parentItems) {
      const index = parentItems.findIndex((item) => item.id === itemId)
      if (index !== -1) {
        parentItems.splice(index, 1)
        this.saveCollections()
      }
    }
  }

  // Existing methods
  setMethod(method: HttpMethod) {
    this.method = method
  }

  setUrl(url: string) {
    this.url = url
    if (!this.syncing) {
      this.syncUrlToParams()
    }
  }

  private syncUrlToParams() {
    this.syncing = true
    try {
      const questionIdx = this.url.indexOf('?')
      if (questionIdx === -1) {
        // No query string — keep only disabled params
        const disabled = this.params.filter((p) => !p.enabled && p.key !== '')
        this.params = disabled
        return
      }

      const queryString = this.url.slice(questionIdx + 1)
      const newParams: KeyValuePair[] = []

      if (queryString) {
        const pairs = queryString.split('&')
        for (const pair of pairs) {
          const eqIdx = pair.indexOf('=')
          const key = decodeURIComponent(
            eqIdx === -1 ? pair : pair.slice(0, eqIdx)
          )
          const value =
            eqIdx === -1 ? '' : decodeURIComponent(pair.slice(eqIdx + 1))
          newParams.push({ key, value, enabled: true })
        }
      }

      // Preserve disabled params
      const disabled = this.params.filter((p) => !p.enabled && p.key !== '')
      this.params = [...newParams, ...disabled]
    } finally {
      this.syncing = false
    }
  }

  private syncParamsToUrl() {
    this.syncing = true
    try {
      const baseUrl = this.url.split('?')[0]
      const enabledParams = this.params.filter((p) => p.enabled && p.key !== '')

      if (enabledParams.length === 0) {
        this.url = baseUrl
        return
      }

      const queryString = enabledParams
        .map(
          (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
        )
        .join('&')
      this.url = `${baseUrl}?${queryString}`
    } finally {
      this.syncing = false
    }
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
    if (list === 'params' && !this.syncing) {
      this.syncParamsToUrl()
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
    if (list === 'params' && !this.syncing) {
      this.syncParamsToUrl()
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
