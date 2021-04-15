import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { Observable } from 'rxjs';
import { of, swap, deref, Store } from '@known-as-bmf/store';

interface ConnectionCacheState {
  [hubUrl: string]: Observable<[HubConnection, HubConnectionState]>;
}

const connectionCacheStore: Store<ConnectionCacheState> = of<ConnectionCacheState>(
  {}
);

export const cache = (
  hubUrl: string,
  entry: Observable<[HubConnection, HubConnectionState]>
): void =>
  swap(connectionCacheStore, state => {
    state[hubUrl] = entry;
    return state;
  });

export const lookup = (
  hubUrl: string
): Observable<[HubConnection, HubConnectionState]> => {
  const { [hubUrl]: entry } = deref(connectionCacheStore);
  return entry;
};

export const invalidate = (hubUrl: string): void =>
  swap(connectionCacheStore, state => {
    delete state[hubUrl];
    return state;
  });
