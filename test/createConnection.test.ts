jest.mock('@microsoft/signalr');

import * as signalr from '@microsoft/signalr';

import { createConnection } from '../src/createConnection';

const HubConnectionBuilderMock = (signalr.HubConnectionBuilder as unknown) as jest.MockedClass<
  typeof signalr.HubConnectionBuilder
>;

describe('createConnection', () => {
  let build: jest.Mock<signalr.HubConnection, []>;
  let withUrl: jest.Mock<
    signalr.HubConnectionBuilder,
    [string, signalr.HttpTransportType | signalr.IHttpConnectionOptions]
  >;
  let configureLogging: jest.Mock<
    signalr.HubConnectionBuilder,
    [signalr.LogLevel | string | signalr.ILogger]
  >;

  beforeEach(() => {
    build = jest.fn();
    withUrl = jest.fn().mockReturnThis();
    configureLogging = jest.fn().mockReturnThis();

    HubConnectionBuilderMock.mockImplementation(() => {
      return ({
        build,
        withUrl,
        configureLogging,
      } as unknown) as signalr.HubConnectionBuilder;
    });
  });

  afterEach(() => {
    build.mockReset();
    withUrl.mockReset();
    configureLogging.mockReset();
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
    expect(configureLogging).not.toHaveBeenCalled();
  });

  it('should call HubConnectionBuilder withUrl build - no options', () => {
    createConnection('url');

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', {});
    expect(build).toHaveBeenCalledTimes(1);
    expect(configureLogging).not.toHaveBeenCalled();
  });

  it('should call HubConnectionBuilder withUrl - options', () => {
    const options: signalr.IHttpConnectionOptions = {};
    createConnection('url', options);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', options);
    expect(configureLogging).not.toHaveBeenCalled();
  });

  it('should call HubConnectionBuilder withUrl build - options', () => {
    const options: signalr.IHttpConnectionOptions = {};
    createConnection('url', options);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', options);
    expect(build).toHaveBeenCalledTimes(1);
    expect(configureLogging).not.toHaveBeenCalled();
  });

  it('should use the provided HubConnectionBuilder delegate', () => {
    const options: signalr.IHttpConnectionOptions = {};
    const delegate = jest.fn((builder: signalr.HubConnectionBuilder) =>
      builder.configureLogging(signalr.LogLevel.Error)
    );

    createConnection('url', options, delegate);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(delegate).toHaveBeenCalledTimes(1);
    expect(configureLogging).toHaveBeenCalledTimes(1);
    expect(configureLogging).toHaveBeenCalledWith(signalr.LogLevel.Error);
    expect(withUrl).toHaveBeenCalledTimes(1);
    expect(withUrl).toHaveBeenCalledWith('url', options);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('should override withUrl when using a HubConnectionBuilder delegate', () => {
    const options: signalr.IHttpConnectionOptions = {};
    const delegate = jest.fn((builder: signalr.HubConnectionBuilder) =>
      builder.configureLogging(signalr.LogLevel.Error).withUrl('dummy')
    );

    createConnection('url', options, delegate);

    expect(HubConnectionBuilderMock).toHaveBeenCalledTimes(1);
    expect(delegate).toHaveBeenCalledTimes(1);
    expect(configureLogging).toHaveBeenCalledTimes(1);
    expect(configureLogging).toHaveBeenCalledWith(signalr.LogLevel.Error);
    expect(withUrl).toHaveBeenCalledTimes(2);
    expect(withUrl).toHaveBeenLastCalledWith('url', options);
    expect(build).toHaveBeenCalledTimes(1);
  });
});
