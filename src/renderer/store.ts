import { createStore } from 'redux'
import rootReducer, { IRootState } from './reducers'
import { IAction } from './types'

export default createStore<IRootState, IAction, {}, {}>(rootReducer)
