import { Reducer } from 'redux'
import { IAction } from '../types'

export interface ITool {
  icon: string
  title: string
  description: string
}

export interface IAppState {
  tools: ITool[]
}

const appReducer: Reducer<IAppState> = function (
  state = {
    tools: [
      {
        title: 'Password',
        icon: '',
        description: 'Generate Passwords',
      },
    ],
  },
  action: IAction
) {
  return state
}

export default appReducer
