import React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as UseSyncExternalStoreShim from 'use-sync-external-store/shim'

const g = globalThis as Record<string, unknown>

g.React = React
g.ReactDOM = ReactDOM
g.ReactDOMClient = ReactDOMClient
g.ReactJSXRuntime = ReactJSXRuntime
g.UseSyncExternalStoreShim = UseSyncExternalStoreShim

export { React, ReactDOM, ReactDOMClient, ReactJSXRuntime }
