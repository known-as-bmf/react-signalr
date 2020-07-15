import * as signalr from '@aspnet/signalr';

import { createConnection } from '../src/createConnection';

jest.mock('@aspnet/signalr');

const HubConnectionBuilderMock = (signalr.HubConnectionBuilder as unknown) as jest.MockedClass<
  typeof signalr.HubConnectionBuilder
>;

describe('createConnection', () => {
  let build: jest.Mock<any, any>;
  let withUrl: jest.Mock<any, any>;

  beforeEach(() => {
    build = jest.fn();
    withUrl = jest.fn().mockReturnThis();

    HubConnectionBuilderMock.mockImplementation(() => {
      return ({
        build,
        withUrl,
      } as unknown) as signalr.HubConnectionBuilder;
    });
  });

  afterEach(() => {
    build.mockReset();
    withUrl.mockReset();
    HubConnectionBuilderMock.mockReset();
  });

  it('should be defined and a function', () => {
    expect(createConnection).toBeDefined();
    expect(createConnection).toBeInstanceOf(Function);
  });

  it('should call HubConnectionBuilder withUrl - no options', () => {
    createConnection('url');

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', {});
  });

  it('should call HubConnectionBuilder withUrl build - no options', () => {
    createConnection('url');

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', {});
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('should call HubConnectionBuilder withUrl - options', () => {
    const options: signalr.IHttpConnectionOptions = {};
    createConnection('url', options);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', options);
  });

  it('should call HubConnectionBuilder withUrl build - options', () => {
    const options: signalr.IHttpConnectionOptions = {};
    createConnection('url', options);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', options);
    expect(build).toHaveBeenCalledTimes(1);
  });
});
