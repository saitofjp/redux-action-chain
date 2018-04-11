import * as tape from "tape"
import { ActionChain, createActionChainMiddleware, combineActionChains, attach } from "../../src";

import actionCreatorFactory, { Action } from 'typescript-fsa';
import { createStore, applyMiddleware } from "redux";
import { ThunkAction } from "redux-thunk";

interface State { stateA: {} };

const actionCreator = actionCreatorFactory("Test");

const TYPE_A_TEST_SIMPLE = "A_TEST_SIMPLE";

namespace ActionCreator {
    export const simple = () => ({ type: TYPE_A_TEST_SIMPLE });
    export const payloadNumber = () => ({ type: TYPE_A_TEST_SIMPLE, payload: 1 });
    export const payloadString = () => ({ type: TYPE_A_TEST_SIMPLE, payload: "a" });

    export const paramNumber = (param: number) => ({ type: TYPE_A_TEST_SIMPLE });
    export const paramsString = (param: string) => ({ type: TYPE_A_TEST_SIMPLE });


    export const tsfUndefined = actionCreator(TYPE_A_TEST_SIMPLE + "A");
    export const tsfNumber = actionCreator<number>(TYPE_A_TEST_SIMPLE + "B");
    export const tsfString = actionCreator<string>(TYPE_A_TEST_SIMPLE + "C");
}


namespace Handler {

    export const simple = () => { }
    export const async = async () => { }

    export const simpleAction = (pyaload: {}) => { }
    export const simpleNumber = (pyaload: number, action:Action<number>) => { }
    export const asyncNumber = async (action:Action<number>) => { }
    export const asyncString = async (action:Action<string>) => { }

    export const thunkUndefined = (): ThunkAction<void, State, undefined> => (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const thunkNumber = (pyaload: number, action:Action<number>): ThunkAction<void, State, undefined> => (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const asyncThunkUndefined = (): ThunkAction<Promise<void>, State, undefined> => async (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
    export const asyncThunkNumber = (pyaload: number, action:Action<number>): ThunkAction<Promise<void>, State, undefined> => async (dispatch, getState) => {
        const { stateA } = getState();
        dispatch({ type: 1 });
    }
}


{
    const chain = new ActionChain();

    chain.chain(ActionCreator.simple, ()=> ({type:"PONG"}) )
    chain.chain(ActionCreator.payloadNumber, ActionCreator.simple)

    // typings:expect-error
    chain.chain(ActionCreator.payloadNumber, ActionCreator.paramsString)

    chain.chain(ActionCreator.payloadNumber, ActionCreator.simple)
    chain.chain(ActionCreator.tsfUndefined, ActionCreator.paramsString)

    chain.chain(ActionCreator.tsfNumber, ActionCreator.tsfUndefined)

    // typings:expect-error
    chain.chain(ActionCreator.tsfNumber, ActionCreator.tsfString)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.simple)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramNumber)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramsString)


    chain.chain(ActionCreator.tsfUndefined, attach(Handler.simple))
    chain.chain(ActionCreator.tsfNumber, attach(Handler.simple))
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramNumber)
    chain.chain(TYPE_A_TEST_SIMPLE, ActionCreator.paramsString)

    chain.chain(ActionCreator.tsfUndefined, attach(Handler.simple))
    chain.chain(ActionCreator.tsfUndefined, attach(Handler.async))

    chain.chain(ActionCreator.tsfNumber, attach(Handler.simpleAction))

    chain.chain(ActionCreator.tsfUndefined, attach(Handler.simpleAction))

    chain.chain(ActionCreator.tsfNumber, attach(Handler.asyncNumber))
    chain.chain(ActionCreator.tsfString, attach(Handler.asyncString))

    // typings:expect-error
    chain.chain(ActionCreator.tsfNumber, attach(Handler.simpleString))

    chain.chain(ActionCreator.tsfUndefined, Handler.thunkUndefined)
    chain.chain(ActionCreator.tsfUndefined, Handler.thunkNumber)
    chain.chain(ActionCreator.tsfNumber, Handler.thunkUndefined)
    chain.chain(ActionCreator.tsfNumber, Handler.thunkNumber)
    chain.chain(ActionCreator.tsfString, Handler.thunkUndefined)

    // typings:expect-error
    chain.chain(ActionCreator.tsfString, Handler.thunkNumber)

    chain.chain(ActionCreator.tsfNumber, Handler.asyncThunkNumber)
    chain.chain(ActionCreator.tsfString, Handler.asyncThunkUndefined)

    // typings:expect-error
    chain.chain(ActionCreator.tsfString, Handler.asyncThunkNumber)

    chain.chain(ActionCreator.payloadNumber, ActionCreator.paramNumber)
    chain.chain(ActionCreator.tsfNumber, ActionCreator.tsfNumber)

    chain.chain(ActionCreator.payloadNumber, ActionCreator.paramNumber)
    chain.chain(ActionCreator.tsfNumber, ActionCreator.tsfNumber)
    chain.chain(ActionCreator.tsfNumber, (payload)=>{})
}
