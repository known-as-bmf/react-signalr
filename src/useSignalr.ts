import { HubConnection, IHttpConnectionOptions } from '@aspnet/signalr';
import {
  of,
  swap,
  deref,
  subscribe,
  SubscriptionCallback,
} from '@known-as-bmf/store';
import { useCallback, useEffect, useRef } from 'react';
import { from, fromEventPattern, Observable } from 'rxjs';
import warning from 'tiny-warning';

import { createConnection } from './createConnection';

interface ConnectionEntry {
  connection: null | HubConnection;
  ready: Promise<void>;
}

interface ConnectionState {
  [key: string]: ConnectionEntry;
}

type SendFunction = (methodName: string, arg?: {}) => Observable<void>;
type InvokeFunction = <TResponse = any>(
  methodName: string,
  arg?: {}
) => Observable<TResponse>;
type OnFunction = <TMessage = any>(methodName: string) => Observable<TMessage>;

export interface UseSignalrHookResult {
  /**
   * Proxy to `HubConnection.invoke`.
   *
   * @typeparam TResponse The expected response type.
   * @param {string} methodName The name of the server method to invoke.
   * @param {object} arg The argument used to invoke the server method.
   *
   * @returns {Observable<TResponse>} An observable that emits what `HubConnection.invoke` would have resolved
   * and errors if the call failed or was made when the connecton was closing.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#invoke
   */
  invoke: InvokeFunction;
  /**
   * Utility method used to subscribe to realtime events (`HubConnection.on`, `HubConnection.off`).
   *
   * @param {string} methodName The name of the server method to subscribe to.
   *
   * @returns {Observable<TMessage>} An observable that emits every time a realtime message is recieved.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#on
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#off
   */
  on: OnFunction;
  /**
   * Proxy to `HubConnection.send`
   *
   * @param {string} methodName The name of the server method to invoke.
   * @param {object} arg The argument used to invoke the server method.
   *
   * @returns {Observable<void>} An observable that emits what `HubConnection.send` would have resolved
   * and errors if the call failed or was made when the connecton was closing.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#send
   */
  send: SendFunction;
}

type UseSignalrHook = (
  url: string,
  options?: IHttpConnectionOptions
) => UseSignalrHookResult;

/**
 * Atom storing the connection enties.
 * This is used to enable "sub-connection" joining.
 *
 * If a component requests a connection to an URL to be opened
 * and a parent component already openend a connction to this URL,
 * the already established connection will be used.
 */
const connectionsStore = of<ConnectionState>({});

/**
 * Adds a connection entry to the connections atom.
 * @param url The URL of the connection to add to the atom.
 * @param entry The actual connection entry to add.
 */
const registerConnection = (url: string, entry: ConnectionEntry): void =>
  swap(connectionsStore, state => ({ ...state, [url]: entry }));

/**
 * Removes a connection entry from the connections atom.
 * @param url The URL of the connection to remove from the atom.
 */
const deregisterConnection = (url: string): void =>
  swap(connectionsStore, state => {
    const newState = { ...state };
    delete newState[url];
    return newState;
  });

/**
 * Observe mutations on the connections atom.
 * @param observeFn The callback to call when the atom mutates.
 */
const observeConnections = (
  observeFn: SubscriptionCallback<ConnectionState>
): (() => void) => subscribe(connectionsStore, observeFn);

const isClosingSymbol = Symbol('isClosing');
const isClosingMessage = 'Connection is closing or already closed.';

const defaultEntry: ConnectionEntry = {
  connection: null,
  get ready(): Promise<void> {
    return Promise.reject(isClosingSymbol);
  },
};

/**
 * Hook used to interact with a signalr connection.
 * @param url The URL of the signalr hub endpoint to connect to.
 * @param options Options object to pass to connection builder.
 * @returns An object containing methods to interact with the hub connection.
 */
export const useSignalr: UseSignalrHook = (url, options) => {
  const connectionEntryRef = useRef<ConnectionEntry>(defaultEntry);
  const optionsRef = useRef(options);

  useEffect(() => {
    // lookup the store to see if a connection to the given url has already been initiated
    const { [url]: existingConnectionState } = deref(connectionsStore);

    // if not, it means we are initiating a new connection
    const initiateConnection = !existingConnectionState;

    if (initiateConnection) {
      // we are initiating the connection
      const connection = createConnection(url, optionsRef.current);
      const ready = connection.start();

      const entry: ConnectionEntry = { connection, ready };

      // storing the connection entry in the atom
      registerConnection(url, entry);

      connectionEntryRef.current = entry;

      // cleanup => stopping the connection
      return (): void => {
        // remove the connection entry from the atom
        deregisterConnection(url);

        ready
          // wait for the connection to be ready to stop it
          .then(() => connection.stop())
          .catch(() =>
            warning(
              true,
              'tried to close a connection that was closing or already closed.'
            )
          );
      };
    } else {
      warning(
        !!optionsRef.current,
        'Options were given to a "sub-connection" ' +
          '(a parent component had already initiated a connection to the given URL) ' +
          'and will be ignored.'
      );

      // we are a "sub-connection" (pluging-in an already initiated connection)
      connectionEntryRef.current = existingConnectionState;
      return;
    }
  }, [url]);

  useEffect(() => {
    return observeConnections(({ current }) => {
      const { [url]: storeState } = current;

      if (!storeState) {
        // connection doesn't exist anymore, prevent interaction with it
        connectionEntryRef.current = defaultEntry;
      }
    });
  }, [url]);

  const send = useCallback<SendFunction>((methodName: string, arg?: {}) => {
    const { connection, ready } = connectionEntryRef.current;

    return from(
      ready
        .then(() => connection!.send(methodName, arg))
        .catch(e => {
          if (e === isClosingSymbol) {
            warning(
              true,
              `send('${methodName}') was called but the connection was closing or already closed.`
            );
            throw new Error(isClosingMessage);
          } else {
            // send error from @aspnet/signalr
            throw e;
          }
        })
    );
  }, []);

  const invoke = useCallback<InvokeFunction>(
    <TResponse>(methodName: string, arg?: {}) => {
      const { connection, ready } = connectionEntryRef.current;

      return from(
        ready
          .then(() => connection!.invoke<TResponse>(methodName, arg))
          .catch(e => {
            if (e === isClosingSymbol) {
              warning(
                true,
                `invoke('${methodName}') was called but the connection was closing or already closed.`
              );
              throw new Error(isClosingMessage);
            } else {
              // invoke error from @aspnet/signalr
              throw e;
            }
          })
      );
    },
    []
  );

  const on = useCallback<OnFunction>(<TMessage>(methodName: string) => {
    // subscribing to a realtime "event"
    const sub = (handler: (...args: any[]) => void): void => {
      const { connection, ready } = connectionEntryRef.current;

      ready
        .then(() => connection!.on(methodName, handler))
        .catch(() => {
          warning(
            true,
            `tried to subscribe to '${methodName}' but the connection was closing or already closed.`
          );
        });
    };

    // unsubscribing from a realtime "event"
    const unsub = (handler: (...args: any[]) => void): void => {
      const { connection, ready } = connectionEntryRef.current;

      ready
        .then(() => connection!.off(methodName, handler))
        .catch(() => {
          warning(
            true,
            `tried to unsubscribe from '${methodName}' but the connection was closing or already closed.`
          );
        });
    };

    return fromEventPattern<TMessage>(sub, unsub);
  }, []);

  return { invoke, on, send };
};
