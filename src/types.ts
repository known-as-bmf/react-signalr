import {
  HubConnection,
  HubConnectionState,
  // LogLevel,
  // ILogger,
  // IHubProtocol,
  // IRetryPolicy,
} from '@microsoft/signalr';

export type EnhancedHubConnection = HubConnection & {
  onstatechange(callback: (state: HubConnectionState) => void): () => void;
};

// export interface LimitedHubConnectionBuilder {
//   configureLogging(logLevel: LogLevel): LimitedHubConnectionBuilder;

//   configureLogging(logger: ILogger): LimitedHubConnectionBuilder;

//   configureLogging(logLevel: string): LimitedHubConnectionBuilder;

//   configureLogging(
//     logging: LogLevel | string | ILogger
//   ): LimitedHubConnectionBuilder;

//   withHubProtocol(protocol: IHubProtocol): LimitedHubConnectionBuilder;

//   withAutomaticReconnect(): LimitedHubConnectionBuilder;

//   withAutomaticReconnect(retryDelays: number[]): LimitedHubConnectionBuilder;

//   withAutomaticReconnect(
//     reconnectPolicy: IRetryPolicy
//   ): LimitedHubConnectionBuilder;
// }
