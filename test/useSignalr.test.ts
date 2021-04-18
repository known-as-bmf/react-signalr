jest.mock('../src/createConnection');

import {
  HubConnection,
  HubConnectionState,
  IHttpConnectionOptions,
} from '@microsoft/signalr';
import {
  renderHook,
  act,
  RenderHookResult,
  Renderer,
} from '@testing-library/react-hooks';

import { useSignalr } from '../src';
import * as createConnection from '../src/createConnection';

const createConnectionMock = createConnection.createConnection as jest.Mock<
  HubConnection,
  [string, IHttpConnectionOptions | undefined]
>;

// we have to use delays for certain async stuff... TODO: find a way to remove this hack.
// const delay = (duration: number = 0) => new Promise(res => setTimeout(res, duration));

const buildHook = async (
  ...args: Parameters<typeof useSignalr>
): Promise<
  RenderHookResult<unknown, ReturnType<typeof useSignalr>, Renderer<unknown>>
> => {
  const _result = renderHook(() => useSignalr(...args));

  await _result.waitFor(() =>
    expect(_result.result.current.state).toBeDefined()
  );
  return _result;
};

describe('useSignalr', () => {
  let start: jest.Mock<Promise<void>, []>;
  let stop: jest.Mock<Promise<void>, []>;
  let onclose: jest.Mock<void, [(error?: Error) => void]>;
  let onreconnecting: jest.Mock<void, [(error?: Error) => void]>;
  let onreconnected: jest.Mock<void, [(connectionId?: string) => void]>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let on: jest.Mock<void, [string, (...args: any[]) => void]>;
  let off: jest.Mock<void, [string]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let send: jest.Mock<Promise<void>, [string, ...any[]]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let invoke: jest.Mock<Promise<any>, [string, ...any[]]>;

  // this callback will store the "onclose" callback
  // and will be used to cleanup after a test
  // so I dont have to explicitly unmount at the ed of each test
  let teardownCallback: () => void;

  beforeEach(() => {
    start = jest.fn(async () => {
      /* noop */
    });
    stop = jest.fn(async () => {
      /* noop */
    });
    onclose = jest.fn(fn => {
      teardownCallback = fn;
    });
    onreconnecting = jest.fn();
    onreconnected = jest.fn();

    on = jest.fn();
    off = jest.fn();
    send = jest.fn(async (_, ...__) => {
      /* noop */
    });
    invoke = jest.fn(async (_, ...__) => {
      /* noop */
    });

    teardownCallback = () => {
      /* noop */
    };

    createConnectionMock.mockReturnValue(({
      start,
      stop,
      onclose,
      onreconnecting,
      onreconnected,
      on,
      off,
      send,
      invoke,
      state: HubConnectionState.Connected, // fake static state for now
    } as unknown) as HubConnection);
  });

  afterEach(() => {
    createConnectionMock.mockReset();

    start.mockReset();
    stop.mockReset();
    onclose.mockReset();
    onreconnecting.mockReset();
    onreconnected.mockReset();

    on.mockReset();
    off.mockReset();
    send.mockReset();
    invoke.mockReset();

    teardownCallback();
  });

  it('should be a function', () => {
    expect(useSignalr).toBeDefined();
    expect(useSignalr).toBeInstanceOf(Function);
  });

  describe('renders without crashing', () => {
    it('1 param', async () => {
      const { result } = await buildHook('url1');

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith(
        'url1',
        undefined,
        undefined
      );
      expect(result.current.on).toBeDefined();
      expect(result.current.on).toBeInstanceOf(Function);
      expect(result.current.send).toBeDefined();
      expect(result.current.send).toBeInstanceOf(Function);
      expect(result.current.invoke).toBeDefined();
      expect(result.current.invoke).toBeInstanceOf(Function);
    });

    it('2 params', async () => {
      const options = {};
      const { result } = await buildHook('url2', options);

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith(
        'url2',
        options,
        undefined
      );
      expect(result.current.on).toBeDefined();
      expect(result.current.on).toBeInstanceOf(Function);
      expect(result.current.send).toBeDefined();
      expect(result.current.send).toBeInstanceOf(Function);
      expect(result.current.invoke).toBeDefined();
      expect(result.current.invoke).toBeInstanceOf(Function);
    });
  });

  describe('connection management', () => {
    it('should start the connection', async () => {
      const options = {};

      await buildHook('url3', options);

      expect(start).toHaveBeenCalledTimes(1);
    });

    it('should create a single connection', async () => {
      const options = {};

      await buildHook('url4', options);
      await buildHook('url4', options);
      await buildHook('url4', options);

      expect(createConnectionMock).toHaveBeenCalledTimes(1);
      expect(createConnectionMock).toHaveBeenCalledWith(
        'url4',
        options,
        undefined
      );
    });

    it('should stop the connection on unmount', async () => {
      const options = {};

      const { unmount } = await buildHook('url5', options);

      unmount();

      expect(stop).toHaveBeenCalledTimes(1);
    });

    it('should register a onclose callback', async () => {
      const options = {};

      await buildHook('url6', options);

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(onclose).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('send', () => {
    it('should call the HubConnection.send method with no arg', async () => {
      const options = {};

      const { result } = await buildHook('url7', options);

      await act(() => result.current.send('test'));

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith('test');
    });

    it('should call the HubConnection.send method with an arg', async () => {
      const options = {};

      const { result } = await buildHook('url8', options);

      await act(() => result.current.send('test', 'arg'));

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith('test', 'arg');
    });
  });

  describe('invoke', () => {
    it('should call the HubConnection.invoke method with no arg', async () => {
      const options = {};

      const { result } = await buildHook('url9', options);

      await act(() => result.current.invoke<void>('test'));

      expect(invoke).toHaveBeenCalledTimes(1);
      expect(invoke).toHaveBeenCalledWith('test');
    });

    it('should call the HubConnection.invoke method with an arg', async () => {
      const options = {};

      const { result } = await buildHook('url10', options);

      await act(() => result.current.invoke<void>('test', 'arg'));

      expect(invoke).toHaveBeenCalledTimes(1);
      expect(invoke).toHaveBeenCalledWith('test', 'arg');
    });
  });

  describe('on', () => {
    it('should do nothing if not subscribed', async () => {
      const options = {};

      const { result } = await buildHook('url11', options);

      await act(() => {
        result.current.on('test');
        return Promise.resolve();
      });

      expect(on).not.toHaveBeenCalled();
      expect(off).not.toHaveBeenCalled();
    });

    it('should call HubConnection.on when subscribing', async () => {
      const options = {};

      const { result } = await buildHook('url12', options);

      await act(() => {
        result.current.on('test').subscribe();
        return Promise.resolve();
      });

      expect(on).toHaveBeenCalledTimes(1);
      expect(on).toHaveBeenCalledWith('test', expect.any(Function));
      expect(off).not.toHaveBeenCalled();
    });

    it('should call HubConnection.off when unsubscribing', async () => {
      const options = {};

      const { result } = renderHook(() => useSignalr('url13', options));

      await act(() => {
        result.current.on('test').subscribe().unsubscribe();
        return Promise.resolve();
      });

      expect(off).toHaveBeenCalledTimes(1);
      expect(off).toHaveBeenCalledWith('test', expect.any(Function));
    });
  });
});
