import {
  HubConnection,
  HubConnectionState,
  IHttpConnectionOptions,
} from '@microsoft/signalr';
import { useCallback, useEffect, useMemo } from 'react';
import { fromEventPattern, Observable } from 'rxjs';
import {
  shareReplay,
  switchMap,
  share,
  take,
  filter,
  distinct,
} from 'rxjs/operators';

import {
  createConnection,
  HubConnectionBuilderDelegate,
} from './createConnection';
import { lookup, invalidate, cache } from './cache';

type SendFunction = (methodName: string, arg?: unknown) => Promise<void>;
type InvokeFunction = <TResponse = unknown>(
  methodName: string,
  arg?: unknown
) => Promise<TResponse>;
type OnFunction = <TMessage = unknown>(
  methodName: string
) => Observable<TMessage>;

export interface UseSignalrHookResult {
  /**
   * Proxy to `HubConnection.invoke`.
   *
   * @typeparam TResponse - The expected response type.
   * @param methodName - The name of the server method to invoke.
   * @param arg - The argument used to invoke the server method. If no arg is passed or the value passed is undefined, nothing will be sent to the SignalR endpoint.
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
   * @param arg - The argument used to invoke the server method. If no arg is passed or the value passed is undefined, nothing will be sent to the SignalR endpoint.
   *
   * @returns A promise that resolves when `HubConnection.send` would have resolved.
   *
   * @see https://docs.microsoft.com/fr-fr/javascript/api/%40aspnet/signalr/hubconnection?view=signalr-js-latest#send
   */
  send: SendFunction;
}

function getOrSetupConnection(
  hubUrl: string,
  options?: IHttpConnectionOptions,
  delegate?: HubConnectionBuilderDelegate
): Observable<[HubConnection, HubConnectionState]> {
  // find if a connection is already cached for this hub
  let context$ = lookup(hubUrl);

  if (!context$) {
    // if no connection is established, create one and wrap it in an shared replay observable
    context$ = new Observable<[HubConnection, HubConnectionState]>(observer => {
      const connection = createConnection(hubUrl, options, delegate);

      const emit = (): void => {
        observer.next([connection, connection.state]);
      };

      emit();

      // when the connection closes
      connection.onclose(() => {
        emit();

        // remove the connection from the cache
        invalidate(hubUrl);

        // close the observable (trigger the teardown)
        observer.complete();
      });

      connection.onreconnecting(emit);

      connection.onreconnected(emit);

      // start the connection and emit to the observable when the connection is ready
      void connection.start().then(emit);
      emit();

      // teardown logic will be executed when there is no subscribers left (close the connection)
      return () => {
        void connection.stop();
        emit();
      };
    }).pipe(
      // do not emit duplicated states (is this possible ?)
      distinct(([, state]) => state),
      // everyone subscribing will get the same connection
      // refCount is used to complete the observable when there is no subscribers left
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    // add the connection to the cache
    cache(hubUrl, context$);
  }

  return context$;
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
  options?: IHttpConnectionOptions,
  delegate?: HubConnectionBuilderDelegate
): UseSignalrHookResult {
  // ignore hubUrl, options & delegate changes, todo: useRef, useState ?
  const context$ = useMemo(
    () => getOrSetupConnection(hubUrl, options, delegate),
    []
  );

  useEffect(() => {
    // used to maintain 1 active subscription while the hook is rendered
    const subscription = context$.subscribe(); // todo: handle on complete (unexpected connection stop) ?

    return () => subscription.unsubscribe();
  }, [context$]);

  const send = useCallback<SendFunction>(
    (methodName: string, arg?: unknown) => {
      return context$
        .pipe(
          // only interested if the connection established
          // this will make the code "wait" for the connection to be established
          filter(([, state]) => state === HubConnectionState.Connected),
          // TODO: add a timeoutWith(duration, throwError("Connection was not established after Xsec.")) ?
          // take the latest value
          take(1),
          // use the connection
          switchMap(([connection]) => {
            if (arg === undefined) {
              // no argument provided
              return connection.send(methodName);
            } else {
              return connection.send(methodName, arg);
            }
          })
        )
        .toPromise();
    },
    [context$]
  );

  const invoke = useCallback<InvokeFunction>(
    <TResponse>(methodName: string, arg?: unknown) => {
      return context$
        .pipe(
          // only interested if the connection established
          // this will make the code "wait" for the connection to be established
          filter(([, state]) => state === HubConnectionState.Connected),
          // TODO: add a timeoutWith(duration, throwError("Connection was not established after Xsec.")) ?
          // take the latest value
          take(1),
          // use the connection
          switchMap(([connection]) => {
            if (arg === undefined) {
              // no argument provided
              return connection.invoke<TResponse>(methodName);
            } else {
              return connection.invoke<TResponse>(methodName, arg);
            }
          })
        )
        .toPromise();
    },
    [context$]
  );

  const on = useCallback<OnFunction>(
    <TMessage>(methodName: string) => {
      return context$
        .pipe(
          // take the latest value of the observable
          take(1),
          // use the connection
          switchMap(([connection]) =>
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
    [context$]
  );

  return { invoke, on, send };
}
