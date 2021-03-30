import {
  HubConnectionBuilder,
  IHttpConnectionOptions,
  HubConnection,
  LogLevel,
  ILogger,
  IRetryPolicy,
} from '@microsoft/signalr';

/**
 * Creates a signalr hub connection.
 * @param url - The URL of the signalr hub endpoint to connect to.
 * @param options - Optional options object to pass to connection builder.
 * @param logging - Optional logging options to pass to connection builder.
 * @param reconnectOptions - Optional reconnect options to pass to connection builder.
 */
export const createConnection = (
  url: string,
  options: IHttpConnectionOptions = {},
  logging: LogLevel | string | ILogger,
  reconnectOptions: boolean | IRetryPolicy | number[]
): HubConnection => {
  const hubConnectionBuilder = new HubConnectionBuilder().withUrl(url, options);

  if (logging) {
    hubConnectionBuilder.configureLogging(logging);
  }

  if (reconnectOptions) {
    if (typeof reconnectOptions === 'boolean') {
      hubConnectionBuilder.withAutomaticReconnect();
    } else if (Array.isArray(reconnectOptions)) {
      hubConnectionBuilder.withAutomaticReconnect(reconnectOptions as number[]);
    } else {
      hubConnectionBuilder.withAutomaticReconnect(
        reconnectOptions as IRetryPolicy
      );
    }
  }

  return hubConnectionBuilder.build();
};
