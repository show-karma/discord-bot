// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecordStringAny = Record<string, any>;
export interface MixpanelProviderOptions {
  /**
   * A prefix to the event name that will be
   * prefixed like prefix:eventName
   */
  eventNamePrefix?: string;
  /**
   * Appends data in the event properties.
   */
  appendData?: Record<string, unknown>;
}
