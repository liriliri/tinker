import { Reducer } from 'redux'
import { IAction } from '../types'

export interface IAppState {}

const appReducer: Reducer<IAppState> = function (state = {}, action: IAction) {
  return state
}

export default appReducer
