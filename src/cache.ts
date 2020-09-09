import { Observable } from 'rxjs';
import { of, swap, deref } from '@known-as-bmf/store';

import { EnhancedHubConnection } from './types';

interface ConnectionCacheState {
  [hubUrl: string]: Observable<EnhancedHubConnection>;
}

const connectionCacheStore = of<ConnectionCacheState>({});

export const cache = (
  hubUrl: string,
  entry: Observable<EnhancedHubConnection>
): void =>
  swap(connectionCacheStore, state => {
    state[hubUrl] = entry;
    return state;
  });

export const lookup = (hubUrl: string): Observable<EnhancedHubConnection> => {
  const { [hubUrl]: entry } = deref(connectionCacheStore);
  return entry;
};

export const invalidate = (hubUrl: string): void =>
  swap(connectionCacheStore, state => {
    delete state[hubUrl];
    return state;
  });
