import hexEditor from 'react-hex-editor'
import * as styledComponents from 'styled-components'

const g = globalThis as Record<string, unknown>

g.hexEditor = hexEditor
g.styledComponents = styledComponents

export default hexEditor
