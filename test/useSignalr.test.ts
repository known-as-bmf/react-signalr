import { renderHook } from '@testing-library/react-hooks';

import { useSignalr } from '../src';
import * as createConnection from '../src/createConnection';

jest.mock('../src/createConnection');

const createConnectionMock = createConnection.createConnection as jest.Mock<
  any,
  any
>;

// we have to use delays for certain async stuff... TODO: find a way to remove this hack.
// const delay = (duration: number = 0) => new Promise(res => setTimeout(res, duration));

describe('useSignalr', () => {
  beforeEach(() => {
    createConnectionMock.mockReturnValue({ start: () => Promise.resolve() });
  });

  afterEach(() => {
    createConnectionMock.mockReset();
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
});
