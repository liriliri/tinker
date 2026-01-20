import { loader } from '@monaco-editor/react'
import * as MonacoEditorReact from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker&url'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker&url'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker&url'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker&url'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker&url'

loader.config({ monaco })

const formatWorkerPath = (url: string) => {
  return `/vendor/monaco${url}`
}

self.MonacoEnvironment = {
  getWorkerUrl(_moduleId: string, label: string) {
    const workerUrls: Record<string, string> = {
      json: formatWorkerPath(jsonWorker),
      css: formatWorkerPath(cssWorker),
      html: formatWorkerPath(htmlWorker),
      javascript: formatWorkerPath(tsWorker),
      typescript: formatWorkerPath(tsWorker),
      editorWorkerService: formatWorkerPath(editorWorker),
    }

    return workerUrls[label] || formatWorkerPath(editorWorker)
  },
}

const g = globalThis as Record<string, unknown>

g.MonacoEditorReact = MonacoEditorReact

export { MonacoEditorReact }
