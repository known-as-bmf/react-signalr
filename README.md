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
    const sub = on<MyType>('myMethod').pipe(debounceTime(200)).subscribe(set);

    return () => sub.unsubscribe();
  }, [on]);

  const notify = useCallback(() => {
    send('remoteMethod', { foo: 'bar' });
  }, []);
};
```

Connections are cached, it means that if you open a connection to an url, further calls to `useSignalr` with the same url will use the same connection.

When the last hook using a specific connection is unmounted, this connection is closed.

## API

### useSignalr

```ts
/**
 * Hook used to interact with a signalr connection.
 * Parameter changes (`hubUrl`, `options`) are not taken into account and will not rerender.
 * @param hubUrl - The URL of the signalr hub endpoint to connect to.
 * @param options - Options object to pass to connection builder.
 * @returns An object containing methods to interact with the hub connection.
 */
function useSignalr(
  hubUrl: string,
  options?: IHttpConnectionOptions
): UseSignalrHookResult;
```

```ts
interface UseSignalrHookResult {
  /**
   * Proxy to `HubConnection.invoke`.
   *
   * @typeparam TResponse - The expected response type.
   * @param methodName - The name of the server method to invoke.
   * @param arg - The argument used to invoke the server method.
   *
   * @returns A promise that resolves what `HubConnection.invoke` would have resolved.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#invoke
   */
  invoke: InvokeFunction;
  /**
   * Utility method used to subscribe to realtime events (`HubConnection.on`, `HubConnection.off`).
   *
   * @typeparam TMessage - The expected message type.
   * @param methodName - The name of the server method to subscribe to.
   *
   * @returns An observable that emits every time a realtime message is recieved.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#on
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#off
   */
  on: OnFunction;
  /**
   * Proxy to `HubConnection.send`
   *
   * @param methodName - The name of the server method to invoke.
   * @param arg - The argument used to invoke the server method.
   *
   * @returns A promise that resolves when `HubConnection.send` would have resolved.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#send
   */
  send: SendFunction;
}
```

### SendFunction

```ts
type SendFunction = (methodName: string, arg?: unknown) => Promise<void>;
```

### InvokeFunction

```ts
type InvokeFunction = <TResponse = unknown>(
  methodName: string,
  arg?: unknown
) => Promise<TResponse>;
```

### OnFunction

```ts
type OnFunction = <TMessage = unknown>(
  methodName: string
) => Observable<TMessage>;
```
