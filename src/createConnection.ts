import {
  HubConnectionBuilder,
  IHttpConnectionOptions,
  HubConnection,
} from '@microsoft/signalr';

interface IBuilderFunction {
  (builder: HubConnectionBuilder): void;
}

/**
 * Creates a signalr hub connection.
 * @param url - The URL of the signalr hub endpoint to connect to.
 * @param options - Optional options object to pass to connection builder.
 * @param builder - Optional function to apply additional options such as logging/automatic reconnection to the HubConnectionBuilder.
 */
const createConnection = (
  url: string,
  options: IHttpConnectionOptions = {},
  builder?: IBuilderFunction
): HubConnection => {
  const hubConnectionBuilder = new HubConnectionBuilder().withUrl(url, options);

  // Apply additional options to the HubConnectionBuilder if supplied
  builder && builder(hubConnectionBuilder);

  return hubConnectionBuilder.build();
};

export { IBuilderFunction, createConnection };
