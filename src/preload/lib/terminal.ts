import { ipcRenderer } from 'electron'
import {
  IpcCreateTerminal,
  IpcDestroyTerminal,
  IpcGetTerminalInfo,
  IpcResizeTerminal,
  IpcWriteTerminal,
} from 'common/types'
import { invoke } from 'share/preload/util'

type DataCallback = (data: string) => void
type CloseCallback = () => void
type InputCallback = () => void

const dataCallbacks = new Map<string, DataCallback>()
const closeCallbacks = new Map<string, CloseCallback>()
const inputCallbacks = new Map<string, InputCallback>()

ipcRenderer.on('terminalData', (_event, sessionId: string, data: string) => {
  dataCallbacks.get(sessionId)?.(data)
})

ipcRenderer.on('terminalClose', (_event, sessionId: string) => {
  closeCallbacks.get(sessionId)?.()
  dataCallbacks.delete(sessionId)
  closeCallbacks.delete(sessionId)
  inputCallbacks.delete(sessionId)
})

export const createTerminal = invoke<IpcCreateTerminal>('createTerminal')
const invokeWrite = invoke<IpcWriteTerminal>('writeTerminal')
export const writeTerminal = (id: string, data: string) => {
  const promise = invokeWrite(id, data)
  if (data.includes('\r') || data.includes('\n')) {
    inputCallbacks.get(id)?.()
  }
  return promise
}
export const resizeTerminal = invoke<IpcResizeTerminal>('resizeTerminal')
const invokeDestroy = invoke<IpcDestroyTerminal>('destroyTerminal')
export const destroyTerminal = (id: string) => {
  dataCallbacks.delete(id)
  closeCallbacks.delete(id)
  inputCallbacks.delete(id)
  return invokeDestroy(id)
}
export const getTerminalInfo = invoke<IpcGetTerminalInfo>('getTerminalInfo')

export function onTerminalData(id: string, cb: DataCallback): void {
  dataCallbacks.set(id, cb)
}

export function onTerminalClose(id: string, cb: CloseCallback): void {
  closeCallbacks.set(id, cb)
}

export function onTerminalInput(id: string, cb: InputCallback): void {
  inputCallbacks.set(id, cb)
}
