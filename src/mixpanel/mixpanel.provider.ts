import { Mixpanel, init as createMixpanel, Event as MixpanelEvent } from 'mixpanel';

interface MixpanelProviderOptions {
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

/**
 * Provides standard services for mix panel
 */
export class MixpanelProvider {
  private readonly mixpanel: Mixpanel;

  private events: MixpanelEvent[] = [];

  constructor(token: string, private options?: MixpanelProviderOptions) {
    this.mixpanel = createMixpanel(token);
  }

  private getEventName(name: string) {
    const { eventNamePrefix } = this.options;
    return eventNamePrefix ? `${eventNamePrefix}:${name}` : name;
  }

  /**
   * Enqueue an event to the event queue to be dispatched by @method dispatch
   * @param data
   */
  enqueue(data: MixpanelEvent): void {
    this.events.push({
      event: this.getEventName(data.event),
      properties: {
        ...data.properties,
        ...this.options?.appendData
      }
    });
  }

  /**
   * Clear enqueued events
   */
  clearEvents() {
    this.events.splice(0, this.events.length);
  }

  /**
   * Dispatch and clear events enqueued with @method enqueue
   */
  dispatch(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mixpanel.track_batch(this.events, (err) => {
        if (err) reject(err);
        else {
          this.clearEvents();
          resolve();
        }
      });
    });
  }

  /**
   * Reports a single event to mixpanel dashboard
   * @param data
   */
  reportEvent(data: MixpanelEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mixpanel.track(
        data.event,
        {
          ...data.properties,
          ...this.options?.appendData
        },
        (err) => {
          if (err) reject(err);
          else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * The amount of enqueued events
   */
  get eventCount() {
    return this.events.length;
  }

  /**
   * The enqueued events data
   */
  get enqueuedEvents() {
    return this.events;
  }

  /**
   * Factories the mixpanel client. If environment variable is not set
   * it will throw an error.
   */
  static factory(options?: MixpanelProviderOptions) {
    if (process.env?.MIXPANEL_AUTH_TOKEN) {
      return new this(process.env.MIXPANEL_AUTH_TOKEN, options);
    } else throw new Error('MIXPANEL_AUTH_TOKEN is not set.');
  }
}
