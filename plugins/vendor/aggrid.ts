import * as AgGridCommunity from 'ag-grid-community'
import * as AgGridReactModule from 'ag-grid-react'

const g = globalThis as Record<string, unknown>

g.AgGridCommunity = AgGridCommunity
g.AgGridReact = AgGridReactModule

export { AgGridCommunity }
export const AgGridReact = AgGridReactModule.AgGridReact
