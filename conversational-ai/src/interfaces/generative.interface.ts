export type ResponseMetadata = {
  tokensIn: number;
  tokensOut: number;
  latencyMs?: number;
};

export type ExecuteResponsePayload = {
  response: string;
  metadata: ResponseMetadata;
};

export type TrackGeneratedResponseUsage = {
  sessionId: string;
  metadata: ResponseMetadata;
};
