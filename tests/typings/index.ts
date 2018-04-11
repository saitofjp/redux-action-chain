import * as tape from "tape"
import { ActionChain, createActionChainMiddleware, combineActionChains, attach } from "../../src";

import actionCreatorFactory, { Action } from 'typescript-fsa';
import { createStore, applyMiddleware } from "redux";
import { ThunkAction } from "redux-thunk";
import { MiddlewareAPI } from "redux";

interface State { stateA: {} };

const actionCreator = actionCreatorFactory("Test");

const TYPE_A_TEST_SIMPLE = "A_TEST_SIMPLE";

namespace ActionCreator {
    export const simple = () => ({ type: TYPE_A_TEST_SIMPLE });
    export const payloadNumber = () => ({ type: TYPE_A_TEST_SIMPLE, payload: 1 });
    export const payloadString = () => ({ type: TYPE_A_TEST_SIMPLE, payload: "a" });

    export const paramNumber = (pyaload: number) => ({ type: TYPE_A_TEST_SIMPLE });
    export const paramsString = (pyaload: string) => ({ type: TYPE_A_TEST_SIMPLE });


    export const tfsaUndefined = actionCreator(TYPE_A_TEST_SIMPLE + "A");
    export const tfsaNumber = actionCreator<number>(TYPE_A_TEST_SIMPLE + "B");
    export const tfsaString = actionCreator<string>(TYPE_A_TEST_SIMPLE + "C");
}


namespace Handler {

    export const simple = () => { }
    export const async = async () => { }
    export const asyncNumber = async (action: Action<number>) => { }
    export const asyncString = async (action: Action<string>) => { }

    export const thunkUndefined = (): ThunkAction<void, State, undefined> => (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const thunkNumber = (pyaload: number, action: Action<number>): ThunkAction<void, State, undefined> => (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const asyncThunkUndefined = (): ThunkAction<Promise<void>, State, undefined> => async (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const asyncThunkNumber = (pyaload: number, action: Action<number>): ThunkAction<Promise<void>, State, undefined> => async (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
}


{
    const chain = new ActionChain();

    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.simple)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramNumber)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramsString)


    chain.chain(ActionCreator.simple, () => ({ type: "PONG" }))
    chain.chain(ActionCreator.payloadNumber, ActionCreator.simple)
    chain.chain(ActionCreator.payloadNumber, ActionCreator.paramNumber)
    // typings:expect-error
    chain.chain(ActionCreator.payloadNumber, ActionCreator.paramsString)

} {

    const chain = new ActionChain();

    chain.chain(ActionCreator.tfsaUndefined, ActionCreator.paramsString)

    chain.chain(ActionCreator.tfsaNumber, ActionCreator.tfsaUndefined)
    chain.chain(ActionCreator.tfsaNumber, ActionCreator.tfsaNumber)
    // typings:expect-error
    chain.chain(ActionCreator.tfsaNumber, ActionCreator.tfsaString)

    chain.chain(ActionCreator.tfsaNumber, (payload) => { })
} {

    const chain = new ActionChain();

    chain.chain(ActionCreator.tfsaUndefined, Handler.thunkUndefined)
    chain.chain(ActionCreator.tfsaUndefined, Handler.thunkNumber)


    chain.chain(ActionCreator.tfsaNumber, Handler.thunkUndefined)
    chain.chain(ActionCreator.tfsaNumber, Handler.thunkNumber)
    chain.chain(ActionCreator.tfsaNumber, Handler.asyncThunkNumber)


    chain.chain(ActionCreator.tfsaString, Handler.asyncThunkUndefined)
    // typings:expect-error
    chain.chain(ActionCreator.tfsaString, Handler.thunkNumber)
    // typings:expect-error
    chain.chain(ActionCreator.tfsaString, Handler.asyncThunkNumber)


} {
    const chain = new ActionChain();

    chain.chain(ActionCreator.tfsaUndefined, attach(Handler.simple))
    chain.chain(ActionCreator.tfsaUndefined, attach(Handler.async))

    chain.chain(ActionCreator.tfsaNumber, attach(Handler.simple))
    chain.chain(ActionCreator.tfsaNumber, attach(Handler.asyncNumber))
    chain.chain(ActionCreator.tfsaString, attach(Handler.asyncString))

    // typings:expect-error
    chain.chain(ActionCreator.tfsaNumber, attach(Handler.simpleString))

    chain.chain(ActionCreator.tfsaNumber, attach<Action<number>, State>((action, { getState }) => {
        const pyaload: number = action.payload
        const state: State = getState();
    }))

}
