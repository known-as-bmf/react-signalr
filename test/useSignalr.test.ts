import { renderHook, act } from '@testing-library/react-hooks';

import { useSignalr } from '../src';
import * as createConnection from '../src/createConnection';
import { Subscription } from 'rxjs';

jest.mock('../src/createConnection');

const createConnectionMock = createConnection.createConnection as jest.Mock<
  any,
  any
>;

// we have to use delays for certain async stuff... TODO: find a way to remove this hack.
// const delay = (duration: number = 0) => new Promise(res => setTimeout(res, duration));

describe('useSignalr', () => {
  let start: jest.Mock<any, any>;
  let stop: jest.Mock<any, any>;
  let onclose: jest.Mock<any, any>;

  let on: jest.Mock<any, any>;
  let off: jest.Mock<any, any>;
  let send: jest.Mock<any, any>;
  let invoke: jest.Mock<any, any>;

  beforeEach(() => {
    start = jest.fn(async () => {
      /** noop */
    });
    stop = jest.fn(async () => {
      /** noop */
    });
    onclose = jest.fn();

    on = jest.fn();
    off = jest.fn();
    send = jest.fn(async () => {
      /** noop */
    });
    invoke = jest.fn(async () => {
      /** noop */
    });

    createConnectionMock.mockReturnValue({
      start,
      onclose,
      stop,
      on,
      off,
      send,
      invoke,
    });
  });

  afterEach(() => {
    createConnectionMock.mockReset();

    start.mockReset();
    stop.mockReset();
    onclose.mockReset();

    on.mockReset();
    off.mockReset();
    send.mockReset();
    invoke.mockReset();
  });

  it('should be a function', () => {
    expect(useSignalr).toBeDefined();
    expect(useSignalr).toBeInstanceOf(Function);
  });

  describe('renders without crashing', () => {
    it('1 param', () => {
      const { result } = renderHook(() => useSignalr('url1'));

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith('url1', undefined);
      expect(result.current.on).toBeDefined();
      expect(result.current.on).toBeInstanceOf(Function);
      expect(result.current.send).toBeDefined();
      expect(result.current.send).toBeInstanceOf(Function);
      expect(result.current.invoke).toBeDefined();
      expect(result.current.invoke).toBeInstanceOf(Function);
    });

    it('2 params', () => {
      const options = {};
      const { result } = renderHook(() => useSignalr('url2', options));

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith('url2', options);
      expect(result.current.on).toBeDefined();
      expect(result.current.on).toBeInstanceOf(Function);
      expect(result.current.send).toBeDefined();
      expect(result.current.send).toBeInstanceOf(Function);
      expect(result.current.invoke).toBeDefined();
      expect(result.current.invoke).toBeInstanceOf(Function);
    });
  });

  describe('connection management', () => {
    it('should start the connection', () => {
      const options = {};

      renderHook(() => useSignalr('url2', options));

      expect(start).toHaveBeenCalledTimes(1);
    });

    it('should create a single connection', () => {
      const options = {};

      renderHook(() => useSignalr('url2', options));
      renderHook(() => useSignalr('url2', options));
      renderHook(() => useSignalr('url2', options));

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith('url2', options);
    });

    it('should stop the connection on unmount', () => {
      const options = {};

      const { unmount } = renderHook(() => useSignalr('url2', options));

      unmount();

      expect(stop).toHaveBeenCalledTimes(1);
    });

    it('should register a onclose callback', () => {
      const options = {};
      let teardownCallback: () => void = () => {
        /** noop */
      };

      onclose.mockImplementation((fn: () => void) => {
        teardownCallback = fn;
      });

      renderHook(() => useSignalr('url2', options));

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(onclose).toHaveBeenCalledWith(expect.any(Function));

      teardownCallback();
    });
  });

  describe('send', () => {
    it('should call the HubConnection.send method', async () => {
      const options = {};

      const { result } = renderHook(() => useSignalr('url2', options));

      await act(() => result.current.send('test', 'arg'));

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith('test', 'arg');
    });
  });

  describe('invoke', () => {
    it('should call the HubConnection.invoke method', async () => {
      const options = {};

      const { result } = renderHook(() => useSignalr('url2', options));

      await act(() => result.current.invoke('test', 'arg'));

      expect(invoke).toHaveBeenCalledTimes(1);
      expect(invoke).toHaveBeenCalledWith('test', 'arg');
    });
  });

  describe('on', () => {
    it('should do nothing if not subscribed', () => {
      const options = {};

      const { result } = renderHook(() => useSignalr('url2', options));

      result.current.on('test');

      expect(on).not.toHaveBeenCalled();
    });

    it('should call HubConnection.on when subscribing', async () => {
      const options = {};

      const { result } = renderHook(() => useSignalr('url2', options));

      const obs$ = result.current.on('test');
      await act(() => {
        obs$.subscribe();
        return Promise.resolve();
      });

      expect(on).toHaveBeenCalledTimes(1);
      expect(on).toHaveBeenCalledWith('test', expect.any(Function));
    });

    it('should call HubConnection.off when unsubscribing', async () => {
      const options = {};
      let subscription: Subscription;

      const { result } = renderHook(() => useSignalr('url2', options));

      const obs$ = result.current.on('test');
      await act(() => {
        subscription = obs$.subscribe();
        return Promise.resolve();
      });

      await act(() => {
        subscription.unsubscribe();
        return Promise.resolve();
      });

      expect(off).toHaveBeenCalledTimes(1);
      expect(off).toHaveBeenCalledWith('test', expect.any(Function));
    });
  });
});
