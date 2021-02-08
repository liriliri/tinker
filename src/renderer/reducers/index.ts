import { combineReducers } from 'redux'
import appReducer, { IAppState } from './app'

export interface IRootState {
  app: IAppState
}

export default combineReducers<IRootState>({
  app: appReducer,
})
