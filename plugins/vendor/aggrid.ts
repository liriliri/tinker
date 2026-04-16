import * as AgGridCommunity from 'ag-grid-community'
import * as AgGridReactModule from 'ag-grid-react'
import { expose } from './util'

expose({ AgGridCommunity, AgGridReact: AgGridReactModule })

export { AgGridCommunity }
export const AgGridReact = AgGridReactModule.AgGridReact
