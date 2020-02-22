import {
  HubConnectionBuilder,
  IHttpConnectionOptions,
  HubConnection,
} from '@aspnet/signalr';

/**
 * Creates a signalr hub connection.
 * @param url The URL of the signalr hub endpoint to connect to.
 * @param options Options object to pass to connection builder.
 */
export const createConnection = (
  url: string,
  options: IHttpConnectionOptions = {}
): HubConnection => new HubConnectionBuilder().withUrl(url, options).build();
