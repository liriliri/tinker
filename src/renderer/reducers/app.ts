import { Reducer } from 'redux'
import { IAction } from '../types'

interface ITool {
  icon: string
  title: string
  description: string
}

export interface IAppState {
  tools: ITool[]
}

const appReducer: Reducer<IAppState> = function (
  state = {
    tools: [],
  },
  action: IAction
) {
  return state
}

export default appReducer
