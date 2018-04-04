import * as tape from "tape"
import { ActionChain, createActionChainMiddleware, combineActionChains, attach } from "../src";
import { MiddlewareAPI } from "redux";


const dummyApi = (): MiddlewareAPI<{}> & any => {
    const actions = [];
    let last = null;
    return {
        last: () => last,
        actions: () => actions,
        dispatch: (action: any) => { last = action; actions.push(action); },
        getState: Function
    }
};

const payload = 1;
const actionCreator = () => ({ type: "TARGET", payload });

const actionCreatorToString = () => ({ type: "TARGET_TO_STRING", payload });
(<any>actionCreatorToString).toString = () => "TARGET_TO_STRING"

const actionCreatorTFSA = () => ({ type: "TARGET_TSFA", payload });
(<any>actionCreatorTFSA).type = "TARGET_TSFA"


const handler = (payload) => ({ type: "NEXT", payload });
const second = () => ({ type: "second" });
const third = () => ({ type: "third" });


tape("chain get", function (t: tape.Test) {

    const actionCreatorHandler =  (payload) => handler(payload);
    const actual = new ActionChain()
        .chain(actionCreator().type, actionCreatorHandler)
        .get(actionCreator())[0];
    t.equal(actual.actionCreatorHandler, actionCreatorHandler);

    const attachHandler =  (action , {} ) => {};
    const actual2 = new ActionChain()
        .chain(actionCreator().type, attach(attachHandler))
        .get(actionCreator())[0];
    t.equal(actual2.attachHandler, attachHandler);

    t.end();
});

tape("chain handle", function (t: tape.Test) {
    const api = dummyApi();
    const handle =  (payload) => handler(payload);

    const actual = new ActionChain()
        .chain(actionCreator().type, handle)
        .handle(actionCreator(), api)[0];

    t.equal(actual.type, handler(payload).type);
    t.equal(actual.payload, handler(payload).payload);
    t.end();
});

tape("chain simple", function (t: tape.Test) {
    const api = dummyApi();

    new ActionChain()
        .chain(actionCreator().type, (payload) => handler(payload))
        .dispatch(actionCreator(), api)

    t.equal(api.last().type, handler(payload).type);
    t.equal(api.last().payload, handler(payload).payload);
    t.end();
});

tape("chain 2nd arg", function (t: tape.Test) {
    const api = dummyApi();

    new ActionChain()
        .chain(actionCreator().type, (payload, action:{payload:any}) => handler(action.payload))
        .dispatch(actionCreator(), api)

    t.equal(api.last().type, handler(payload).type);
    t.equal(api.last().payload, handler(payload).payload);
    t.end();
});

tape("chain async", async function (t: tape.Test) {
    let api = dummyApi();

    await new ActionChain()
        .chain(actionCreator().type, async (payload) => handler(payload))
        .dispatch(actionCreator(), api);

    t.equal(api.last().type, handler(payload).type);
    t.equal(api.last().payload, handler(payload).payload);
    t.end();
});

tape("chain attach", function (t: tape.Test) {
    let api = dummyApi();
    new ActionChain()
        .chain(actionCreator().type,
            attach( ({payload:number}, { dispatch }) => dispatch(handler(payload))))
        .dispatch(actionCreator(), api);

    t.equal(api.last().type, handler(payload).type);
    t.equal(api.last().payload, handler(payload).payload);
    t.end();
});

tape("chain attach async ", async function (t: tape.Test) {
    let api = dummyApi();
    await new ActionChain()
        .chain(actionCreator().type,
            attach(async ({ payload }, { dispatch }) => dispatch(handler(payload))))
        .dispatch(actionCreator(), api);

    t.equal(api.last().type, handler(payload).type);
    t.equal(api.last().payload, handler(payload).payload);
    t.end();
});


tape("chain attach miss", async function (t: tape.Test) {
    let api = dummyApi();
    t.throws(() => new ActionChain()
        .chain(actionCreator().type,
            (({ payload }, { dispatch }) => dispatch(handler(payload))) as any)
        .handle(actionCreator(), api));

    t.end();
});


tape("chain multi", function (t: tape.Test) {
    let api = dummyApi();
    new ActionChain()
        .chain(actionCreator().type, handler)
        .chain(actionCreator().type, second)
        .chain(actionCreator().type, attach((action, { dispatch }) => dispatch(third())))
        .dispatch(actionCreator(), api);

    t.equal(api.last().type, third().type);
    t.equal(api.actions().length, 3);

    t.end();
});

tape("getTYpe", function (t: tape.Test) {
    const api = dummyApi();
    const chain = new ActionChain()
        .chain(actionCreator().type, (payload) => handler(payload))
        .chain(actionCreatorTFSA, second)
        .chain(actionCreatorToString, third)

    chain.dispatch(actionCreator(), api);
    t.equal(api.last().payload, handler(payload).payload);
    t.equal(api.last().type, handler(payload).type);

    chain.dispatch(actionCreatorTFSA(), api);
    t.equal(api.last().type, second().type);

    chain.dispatch(actionCreatorToString(), api);
    t.equal(api.last().type, third().type);

    t.end();
});


tape("action chain combine", async function (t: tape.Test) {
    const a = new ActionChain()
        .chain(actionCreator().type, handler)
        .chain(actionCreator().type, handler);
    const b = new ActionChain()
        .chain(actionCreator().type, handler);
    const c = new ActionChain()
        .chain(actionCreator().type, handler);

    const allHandlerObjects = combineActionChains(a, b, c).get(actionCreator());

    t.equal(allHandlerObjects.length, 4);

    const hoge = async () => await 1
    console.log(await hoge());
    t.end();
});
