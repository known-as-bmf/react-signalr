import {
  HubConnectionBuilder,
  IHttpConnectionOptions,
  HubConnection,
} from '@microsoft/signalr';

export type HubConnectionBuilderDelegate = (
  builder: HubConnectionBuilder
) => HubConnectionBuilder;

/**
 * Creates a signalr hub connection.
 * @param url - The URL of the signalr hub endpoint to connect to.
 * @param options - Options object to pass to connection builder.
 * @param delegate - A delegate to further customize the HubConnection.
 */
export const createConnection = (
  url: string,
  options: IHttpConnectionOptions = {},
  delegate: HubConnectionBuilderDelegate = b => b
): HubConnection =>
  delegate(new HubConnectionBuilder()).withUrl(url, options).build();
