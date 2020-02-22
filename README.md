This hook is designed to be a proxy to the main [HubConnection](https://docs.microsoft.com/fr-fr/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest) capabilities.

- [invoke](https://docs.microsoft.com/fr-fr/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest#invoke)
- [send](https://docs.microsoft.com/fr-fr/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest#send)
- [on](https://docs.microsoft.com/fr-fr/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest#on) / [off](https://docs.microsoft.com/fr-fr/javascript/api/@aspnet/signalr/hubconnection?view=signalr-js-latest#off)

[![Build Status](https://travis-ci.org/known-as-bmf/react-signalr.svg?branch=master)](https://travis-ci.org/known-as-bmf/react-signalr)
[![Known Vulnerabilities](https://snyk.io//test/github/known-as-bmf/react-signalr/badge.svg?targetFile=package.json)](https://snyk.io//test/github/known-as-bmf/react-signalr?targetFile=package.json)

## Installation

`npm install --save @known-as-bmf/react-signalr`

You also need react (>= 16.8) and rxjs (>= 6) installed in your project.

## Usage

```ts
const signalrEndpoint = 'https://...';

const MyComponent = () => {
  const [value, set] = useState<MyType>();

  const { send, on } = useSignalr(signalrEndpoint);

  useEffect(() => {
    const sub = on<MyType>('myMethod')
      .pipe(debounceTime(200))
      .subscribe(set);

    return () => sub.unsubscribe();
  }, [on]);

  const notify = useCallback(() => {
    send('remoteMethod', { foo: 'bar' });
  }, []);
};
```

Connections are cached, it means that if you open a connection to an url, further calls to `useSignalr` with the same url will use the same connection.

When the component that initiated the connection unmounts, the connection is closed.

## API

### Interfaces

- [IUseSignalrHookResult](#iusesignalrhookresult)

### Functions

- [useSignalr](#iusesignalrhookresult)

## Interfaces

### <a name="iusesignalrhookresult"></a> IUseSignalrHookResult

### Properties

- [invoke](#iusesignalrhookresult_invoke)
- [on](#iusesignalrhookresult_on)
- [send](#iusesignalrhookresult_send)

## Properties

### <a name="iusesignalrhookresult_invoke"></a> invoke

• **invoke**: _`InvokeFunction`_

_Defined in [useSignalr.ts:36](https://github.com/known-as-bmf/react-signalr/blob/98d6b70/src/useSignalr.ts#L36)_

Proxy to `HubConnection.invoke`.

**`typeparam`** The expected response type.

**`param`** The name of the server method to invoke.

**`param`** The argument used to invoke the server method.

**`returns`** An observable that emits what `HubConnection.invoke` would have resolved
and errors if the call failed or was made when the connecton was closing.

**`see`** https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#invoke

---

### <a name="iusesignalrhookresult_on"></a> on

• **on**: _`OnFunction`_

_Defined in [useSignalr.ts:47](https://github.com/known-as-bmf/react-signalr/blob/98d6b70/src/useSignalr.ts#L47)_

Utility method used to subscribe to realtime events (`HubConnection.on`, `HubConnection.off`).

**`param`** The name of the server method to subscribe to.

**`returns`** An observable that emits every time a realtime message is recieved.

**`see`** https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#on

**`see`** https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#off

---

### <a name="iusesignalrhookresult_send"></a> send

• **send**: _`SendFunction`_

_Defined in [useSignalr.ts:59](https://github.com/known-as-bmf/react-signalr/blob/98d6b70/src/useSignalr.ts#L59)_

Proxy to `HubConnection.send`

**`param`** The name of the server method to invoke.

**`param`** The argument used to invoke the server method.

**`returns`** An observable that emits what `HubConnection.send` would have resolved
and errors if the call failed or was made when the connecton was closing.

**`see`** https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#send

### Functions

#### <a name="const-usesignalr"></a> `Const` useSignalr

▸ **useSignalr**(`url`: string, `options`: undefined | `IHttpConnectionOptions`): _object_

_Defined in [useSignalr.ts:110](https://github.com/known-as-bmf/react-signalr/blob/98d6b70/src/useSignalr.ts#L110)_

Hook used to interact with a signalr connection.

**Parameters:**

| Name      | Type                                  | Description                                        |
| --------- | ------------------------------------- | -------------------------------------------------- |
| `url`     | string                                | The URL of the signalr hub endpoint to connect to. |
| `options` | undefined \| `IHttpConnectionOptions` | Options object to pass to connection builder.      |

**Returns:** _object_

An object containing methods to interact with the hub connection.

## TODO

unit tests
