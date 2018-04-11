# redux-action-chain

`redux-action-chain` is a middleware that aims to easily manage side effects of application.

- action is kept as a pure object. compared to [redux-thunk](https://github.com/gaearon/redux-thunk) / [redux-promise](https://github.com/redux-utilities/redux-promise)
- simple and intuitive. compared to [redux-saga](https://github.com/redux-saga/redux-saga) / [redux-observable](https://github.com/redux-observable/redux-observable)

```js
new ActionChain()
    .chain(pingAction, pongAction)
    .chain(userRequest, async ({ userId }) => userFetched(await fetchUser(userId)))
    .chain(userFetched, postsRequest)
    .chain(postsRequest, attach(async (action, { dispatch, getState }) => {
        const { post } = getState();
        if (post.isFetched) return;

        dispatch(postsFetchStart())
        try {
            const posts = await fetchPosts()
            dispatch(postsFetchSuccess(posts));
        } catch (e) {
            dispatch(postsFetchFailed(e));
        }
    }));

```

## Comparison

### Compared to `redux-thunk / redux-promise`

React component can concentrate on dispatching actions such as events and user interactions without knowing what ActionCreator is doing.

- redux-thunk/redux-promise

```
React Component --> (pure action) ActionCreator --> Reducer
React Component --> (async logic  ) ActionCreator
React Component --> (other side effects) ActionCreator
```

- redux-action-chain

```
React Component --> (pure action) ActionCreator --> Reducer

(pure action) ActionCreator  <-- ActionChain (async logic / other side effects)
```

### Compared to `redux-saga / redux-observable`

`redux-action-chain` provides only two features.
* chaining actions. dispatch action after another action finished.
* simple dispatch based flow control (like `thunk`)

It is simple and intuitive, suitable for creating small to medium scale applications.

## Basic example

```js
new ActionChain()
    .chain("PING", () => ({ type: "PONG" }))
    .chain("USER_REQUEST", (payload) => fetchUser(payload.userId)
                                       .then(user => ({ type: "USER_FETCHED", payload: user })))
    .chain("USER_FETCHED", postsRequest)
    .chain("POSTS_REQUEST", attach(async (action, { dispatch, getState }) => {
        const { post } = getState();
        if (post.isFetched) return;

        dispatch({ type: "POSTS_FETCH_START" })
        try {
            const posts = await fetchPosts()
            dispatch({ type: "POSTS_FETCH_SUCCEEDED", user: user });
        } catch (e) {
            dispatch({ type: "POSTS_FETCH_FAILED", message: e.message });
        }
    }));
```
* for easy understanding. **not recommended**. please use *FSA* style.

## FSA (Flux Standard Action) Style

If you adopt [FSA](https://github.com/redux-utilities/flux-standard-action) using [redux-actions](https://github.com/redux-utilities/redux-actions). it can be made simply.

```js
//after
new ActionChain()
    .chain(userRequestAction, userFetchAction )

//before
new ActionChain()
   .chain("USER_REQUEST", (payload, action)=> {type:"USER_FETCH", payload});
```

* call `toString()` of actionCreator ([redux-actions](https://github.com/redux-utilities/redux-actions)).


```js
//same
new ActionChain()
    .chain(userRequestAction, (payload, action) => userFetchAction(payload))
```

### TypeScript FSA

using [TypeScript FSA](https://github.com/aikoven/typescript-fsa) allow you to write type-safe.

```js
new ActionChain()
    .chain(userRequestAction, userFetchAction )
```

## Install

```
npm install --save redux-action-chain
```


## Usage

"combine" and  "applyMiddleware". Like "reducer".

```js
import { ActionChain, attach, combineActionChains, createActionChainMiddleware } from "redux-action-chain";

//pingpong.js
const chainPingPong = new ActionChain()
    .chain("PING", () => ({ type: "PONG" }));

//user.js
const chainUser = new ActionChain()
    .chain("REQUEST_USER", async (payload) => fetchUser(payload.userId))
    .chain("FETCH_USER_SUCCESS", () => fetchBlogPosts())
    .chain("FETCH_USER_SUCCESS", () => ({ type: "PING" }));


//index.js
export const rootActionChain = combineActionChains(chainPingPong, chainUser);


//store.js
import { createActionChainMiddleware } from "redux-action-chain";

const actionChainMiddleware = createActionChainMiddleware(rootActionChain);

const store = createStore(
    reducer,
    applyMiddleware(actionChainMiddleware)
)


// component.js
class UserComponent extends React.Component {
    ...
    onSomeButtonClicked() {
        const { userId, dispatch } = this.props
        dispatch({ type: 'REQUEST_USER', payload: { userId } })
    }
    ...
}

```



## Recipes

### basic

```js
new ActionChain()
    .chain("PING", () => ({ type: "PONG" }))
    .chain("REQUEST_USER", (payload, action) => {
        const userId = payload.userId;
        return { type: "USER_ID", payload: { userId } }
    });

new ActionChain()
    .chain(requestUser, (payload) =>  userId(payload.userId))
    .chain(requestUser, fetchUser)
```

### async

```js
new ActionChain()
    .chain("REQUEST_USER", async (payload, action) => {
        const { userId } = payload;
        const user = await fetchUser(userId)
        return { type: "USER_FETCHED", payload: { user } }
    })

new ActionChain()
    .chain(requestUser, async ({userId}) => userFetched(await fetchUser(userId))
```

### attach

```js
new ActionChain()
    .chain("REQUEST_USER", attach(async (action, { dispatch, getState }) => {
        const { userId } = action.payload;
        const { userState } = getState();
        if (userState.isFetched) return;

        dispatch({ type: "FLOW_START" })
        try {
            const user = await fetchUser(userId);
            dispatch({ type: "USER_FETCH_SUCCEEDED", payload: { user } });
        } catch (e) {
            dispatch({ type: "USER_FETCH_FAILED", message: e.message });
        }
    }));


new ActionChain()
    .chain(requestUser, attach(async (action, { dispatch, getState }) => {
        const { userId } = action.payload;
        const { userState } = getState();
        if (userState.isFetched) return;

        dispatch(flowStart())
        try {
            const user = await fetchUser(userId);
            dispatch(userFetchSuccess(user));
        } catch (e) {
            dispatch(userFetchError(e));
        }
    }));

```

### throttle/sleep

```js

// throttle
import _ from 'lodash'

const throttledUpdateSearchWord = _.throttle(100, (action, { dispatch }) =>{ dispatch(updateSearchWord()); });
new ActionChain()
    .chain(changeInput, throttledUpdateSearchWord)
    .chain(updateSearchWord, searchQuery);


// sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
new ActionChain()
    .chain(pingAction, () => sleep(1000).then(pongAction));
```

## For Test

```js

chainPingPong = new ActionChain();
  .chain(...)

chainPingPong.get(action) => Array<HandlerObject>
chainPingPong.handle(action, {dispatch, getState})　=> Array<next action>
chainPingPong.dispatch(action, {dispatch, getState}) =>  dispatch called

//async
await chainPingPong.dispatch(action, {dispatch, getState};

```
