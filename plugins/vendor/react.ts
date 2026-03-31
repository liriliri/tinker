import React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as UseSyncExternalStoreShim from 'use-sync-external-store/shim'
import * as UseSyncExternalStoreShimWithSelector from 'use-sync-external-store/shim/with-selector'
import * as UseSyncExternalStoreWithSelector from 'use-sync-external-store/with-selector'

const g = globalThis as Record<string, unknown>

g.React = React
g.ReactDOM = ReactDOM
g.ReactDOMClient = ReactDOMClient
g.ReactJSXRuntime = ReactJSXRuntime
g.UseSyncExternalStoreShim = UseSyncExternalStoreShim
g.UseSyncExternalStoreShimWithSelector = UseSyncExternalStoreShimWithSelector
g.UseSyncExternalStoreWithSelector = UseSyncExternalStoreWithSelector

export { React, ReactDOM, ReactDOMClient, ReactJSXRuntime }
