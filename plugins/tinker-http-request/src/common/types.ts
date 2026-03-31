export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export type BodyType = 'none' | 'json' | 'form-urlencoded' | 'text'
export type AuthType = 'none' | 'basic' | 'bearer'

export interface RequestConfig {
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  params: KeyValuePair[]
  bodyType: BodyType
  body: string
  formData: KeyValuePair[]
  authType: AuthType
  authBasicUser: string
  authBasicPass: string
  authBearerToken: string
}

export interface CollectionItem {
  id: string
  type: 'folder' | 'request'
  name: string
  request?: RequestConfig
  children?: CollectionItem[]
}

export interface Collection {
  id: string
  name: string
  items: CollectionItem[]
}

export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  bodyBytes: number[]
  duration: number
  size: number
  error?: string
}
