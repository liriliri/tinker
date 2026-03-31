import HexEditor from 'react-hex-editor'
import * as styledComponents from 'styled-components'

const g = globalThis as Record<string, unknown>

g.ReactHexEditor = HexEditor
g.styledComponents = styledComponents

export default HexEditor
