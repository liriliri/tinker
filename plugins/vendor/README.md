# Vendor Libraries

Pre-built third-party libraries loaded as global scripts. Add `<script src="/vendor/<name>.js"></script>` to the plugin's `index.html` `<head>` section to use.

| Script | Import Module |
|---|---|
| `react.js` | `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime` |
| `mobx.js` | `mobx`, `mobx-react-lite` |
| `lucide.js` | `lucide-react` |
| `resizablepanels.js` | `react-resizable-panels` |
| `aggrid.js` | `ag-grid-community`, `ag-grid-react` |
| `monaco/monaco.js` | `@monaco-editor/react` |
| `syntaxhighlighter.js` | `react-syntax-highlighter`, `react-syntax-highlighter/dist/esm/styles/prism` |
| `markdown.js` | `react-markdown`, `remark-gfm`, `remark-breaks` |
| `mathjs.js` | `mathjs` |
| `idb.js` | `idb` |
| `zxing.js` | `@zxing/library` |
| `htmltoimage.js` | `html-to-image` |
| `wavesurfer.js` | `wavesurfer.js`, `wavesurfer.js/plugins/regions`, `wavesurfer.js/plugins/timeline` |

See `vite.config.ts` for the full mapping of module names to global variable names.
