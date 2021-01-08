import { fromEventPattern, Observable } from 'rxjs';
import { HubConnection, IHttpConnectionOptions } from '@microsoft/signalr';
import { shareReplay, switchMap, share, take } from 'rxjs/operators';
import { useCallback, useEffect, useMemo } from 'react';

import { createConnection } from './createConnection';
import { lookup, invalidate, cache } from './cache';

type SendFunction = (methodName: string, arg?: unknown) => Promise<void>;
type InvokeFunction = <TResponse = unknown>(
  methodName: string,
  arg?: unknown
) => Promise<TResponse>;
type OnFunction = <TMessage = unknown>(
  methodName: string
) => Observable<TMessage>;

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

function getOrSetupConnection(
  hubUrl: string,
  options?: IHttpConnectionOptions
): Observable<HubConnection> {
  // find if a connection is already cached for this hub
  let connection$ = lookup(hubUrl);

  if (!connection$) {
    // if no connection is established, create one and wrap it in an shared replay observable
    connection$ = new Observable<HubConnection>(observer => {
      const connection = createConnection(hubUrl, options);

      // when the connection closes
      connection.onclose(() => {
        // remove the connection from the cache
        invalidate(hubUrl);
        // close the observable (trigger the teardown)
        observer.complete();
      });

      // start the connection and emit to the observable when the connection is ready
      void connection
        .start()
        .then(() => {
          observer.next(connection);
        })
        .catch(err => {
          observer.error(err);
        });

      // teardown logic will be executed when there is no subscribers left (close the connection)
      return () => {
        void connection.stop();
      };
    }).pipe(
      // everyone subscribing will get the same connection
      // refCount is used to complete the observable when there is no subscribers left
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    // add the connection to the cache
    cache(hubUrl, connection$);
  }

  return connection$;
}

/**
 * Hook used to interact with a signalr connection.
 * Parameter changes (`hubUrl`, `options`) are not taken into account and will not rerender.
 *
 * @param hubUrl - The URL of the signalr hub endpoint to connect to.
 * @param options - Options object to pass to connection builder.
 *
 * @returns An object containing methods to interact with the hub connection.
 */
export function useSignalr(
  hubUrl: string,
  options?: IHttpConnectionOptions
): UseSignalrHookResult {
  // ignore hubUrl & options changes, todo: useRef, useState ?
  const connection$ = useMemo(() => getOrSetupConnection(hubUrl, options), []);

  useEffect(() => {
    // used to maintain 1 active subscription while the hook is rendered
    const subscription = connection$.subscribe(); // todo: handle on complete (unexpected connection stop) ?

    return () => subscription.unsubscribe();
  }, [connection$]);

  const send = useCallback<SendFunction>(
    (methodName: string, arg?: unknown) => {
      return connection$
        .pipe(
          // only take the current value of the observable
          take(1),
          // use the connection
          switchMap(connection => connection.send(methodName, arg))
        )
        .toPromise();
    },
    [connection$]
  );

  const invoke = useCallback<InvokeFunction>(
    <TResponse>(methodName: string, arg?: unknown) => {
      return connection$
        .pipe(
          // only take the current value of the observable
          take(1),
          // use the connection
          switchMap(connection => connection.invoke<TResponse>(methodName, arg))
        )
        .toPromise();
    },
    [connection$]
  );

  const on = useCallback<OnFunction>(
    <TMessage>(methodName: string) => {
      return connection$
        .pipe(
          // only take the current value of the observable
          take(1),
          // use the connection
          switchMap(connection =>
            // create an observable from the server events
            fromEventPattern<TMessage>(
              (handler: (...args: unknown[]) => void) =>
                connection.on(methodName, handler),
              (handler: (...args: unknown[]) => void) =>
                connection.off(methodName, handler)
            )
          )
        )
        .pipe(share());
    },
    [connection$]
  );

  return { invoke, on, send };
}
