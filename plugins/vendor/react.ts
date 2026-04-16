import React from 'react'
import * as allReact from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as UseSyncExternalStoreShim from 'use-sync-external-store/shim'
import * as UseSyncExternalStoreShimWithSelector from 'use-sync-external-store/shim/with-selector'
import * as UseSyncExternalStoreWithSelector from 'use-sync-external-store/with-selector'
import { expose } from './util'

expose('React', React, allReact)
expose({
  ReactDOM,
  ReactDOMClient,
  ReactJSXRuntime,
  UseSyncExternalStoreShim,
  UseSyncExternalStoreShimWithSelector,
  UseSyncExternalStoreWithSelector,
})

export { React, ReactDOM, ReactDOMClient, ReactJSXRuntime }
