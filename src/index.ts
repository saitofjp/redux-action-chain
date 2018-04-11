import { Middleware, MiddlewareAPI, Dispatch, Action, ActionCreator } from "redux";
import { isFunction } from "util";

declare module "redux" {
    export interface ActionCreator<A> {
        type?: string;  //etc typescript-fsa ActionCreator
        (...args: any[]): A;
    }
}

export interface AttachHandler<PREV, STATE> {
    (action: PREV, api: MiddlewareAPI<STATE>): void
}

export interface ActionCreatorHandler<PAYLOAD, PREV, NEXT> {
    (payload: PAYLOAD, action: PREV): NEXT
}

export interface HandlerObject<PAYLOAD, PREV, NEXT, STATE> {
    handle(action: PREV): NEXT
    handle(action: PREV, api: MiddlewareAPI<STATE>): NEXT
    actionCreatorHandler?: ActionCreatorHandler<PAYLOAD, PREV, NEXT>
    attachHandler?: AttachHandler<PREV, NEXT>
}

export const attach = <PREV, STATE>(attachHandler: AttachHandler<PREV, STATE>): HandlerObject<any, PREV, void, STATE> => {
    const handle = (action: PREV, api?: MiddlewareAPI<STATE>) => {
        attachHandler(action, api as any);
        return;
    };
    return {
        handle,
        attachHandler
    }
}

const action = <PAYLOAD, PREV, NEXT>(actionCreatorHandler: ActionCreatorHandler<PAYLOAD, PREV, NEXT>, ): HandlerObject<PAYLOAD, PREV, NEXT, any> => {
    const handle = (actionArg: PREV) => {
        const args = [(<any>actionArg).payload, actionArg];
        const next = actionCreatorHandler.apply(undefined, args);
        if (!next) throw new Error("return value must be Action or Promise<Action>. Or, use 'attach()'");
        return next;
    };
    return {
        handle,
        actionCreatorHandler
    }
}

function isPromise(val: any): val is Promise<any> {
    return val && typeof val.then === 'function';
}

function isType(action: any, type: string) {
    return action && action.type == type;
}

function isHandlerObject<PAYLOAD, PREV, NEXT, STATE>(val: any): val is HandlerObject<PAYLOAD, PREV, NEXT, STATE> {
    return val && val.handle
}

function getType(target: ActionCreator<any> | string): string {
    if (typeof target == "string") {
        return target;
    } else if (target.type) {
        return target.type;
    } else {
        return target.toString();
    }
}


export class ActionChain  {

    protected cases: Array<{
        type: string,
        handler: HandlerObject<any, any, any, any>
    }> = [];

    /**
     * target action  is handler function param
     * @param target  actionCreator or type
     * @param handler actionCreator or attach(handler)
     */

    chain<PREV>(
        target: ActionCreator<PREV> | string,
        handler: ActionCreatorHandler<void, PREV, any>
    ): ActionChain

    chain<PREV, NEXT>(
        target: ActionCreator<PREV> | string,
        handler: ActionCreatorHandler<void, PREV, NEXT>
    ): ActionChain

    chain<PAYLOAD, PREV extends { payload: PAYLOAD }>(
        target: ActionCreator<PREV> | string,
        handler: ActionCreatorHandler<PAYLOAD, PREV, any>
    ): ActionChain

    chain<PAYLOAD, PREV extends { payload: PAYLOAD }, NEXT>(
        target: ActionCreator<PREV> | string,
        handler: ActionCreatorHandler<PAYLOAD, PREV, NEXT>
    ): ActionChain

    chain<PREV, STATE>(
        target: ActionCreator<PREV> | string,
        handler: HandlerObject<any, PREV, void, STATE>
    ): ActionChain

    chain<PAYLOAD, PREV, STATE>(
        target: ActionCreator<PREV> | string,
        handler: ActionCreatorHandler<PAYLOAD, PREV, any> | HandlerObject<any, PREV, void, STATE>,
    ): ActionChain {
        this.chainOfType(getType(target),
            isHandlerObject(handler)
                ? handler :
                action(handler as any)
        );
        return this;
    }

    protected chainOfType<PAYLOAD, PREV, NEXT, STATE>(
        type: string,
        handler: HandlerObject<PAYLOAD, PREV, NEXT, STATE>
    ): ActionChain {
        this.cases.push({ type, handler });
        return this;
    }

    get(action: Action) {
        return this.cases
            .filter((chain) => isType(action, chain.type))
            .map((chain) => chain.handler)
    }

    handle<STATE>(action: Action, api: MiddlewareAPI<STATE>) {
        return this.get(action)
            .map(handle => handle.handle(action, api))
            .filter(next => next)
    }

    dispatch<STATE>(action: Action, api: MiddlewareAPI<STATE>) {
        return this.get(action)
            .map(handle => {
                const next = handle.handle(action, api);
                if (!next) return;

                return isPromise(next)
                    ? next.then(api.dispatch)
                    : api.dispatch(next);
            })
            .filter(res => res)
    }

    static build(...chains: ActionChain[]): ActionChain {
        const ac = new ActionChain();
        ac.cases = chains
            .map((chain) => chain.cases)
            .reduce((a, b) => a.concat(b), []);
        return ac;
    }
}


export const createActionChainMiddleware = (chain: ActionChain): Middleware => {
    return <STATE>(api: MiddlewareAPI<STATE>) => {

        return (next: Dispatch<STATE>) => <A extends Action>(action: A): A => {
            const result = next(action);

            chain.dispatch(action, api);

            return result;
        };
    }
}

export const combineActionChains = (...chains: ActionChain[]): ActionChain =>
    ActionChain.build(...chains);