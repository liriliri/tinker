import { Action, ActionCreator } from 'redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { IRootState } from './reducers'

interface IAction extends Action {
  data?: any
}

type IThunkAction = ThunkAction<
  Promise<IAction | void>,
  IRootState,
  void,
  IAction
>

type IReduxActionCreator = ActionCreator<IAction>

type IThunkActionCreator = ActionCreator<IThunkAction>

type IDispatch = ThunkDispatch<IRootState, void, IAction>
