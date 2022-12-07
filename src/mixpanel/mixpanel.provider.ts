import { Mixpanel, init as createMixpanel, Event as MixpanelEvent } from 'mixpanel';
import { MixpanelProviderOptions } from 'src/shared/types';

/**
 * Provides standard services for mix panel
 *
 * @var queueSize
 * @var enqueuedEvents
 *
 * @static factory
 * @method dispatch
 * @method enqueue
 * @method clearQueue
 * @method dequeue
 * @method reportEvent
 *
 * @author [Karma](https://showkarma.xyz)
 * @see [Mixpanel](https://developer.mixpanel.com/docs/nodejs)
 */
export class MixpanelProvider {
  /**
   * The mixpanel instance
   */
  private readonly mixpanel: Mixpanel;

  /**
   * The queue of events that was added by @method enqueue
   */
  private events: MixpanelEvent[] = [];

  constructor(token: string, private options?: MixpanelProviderOptions) {
    this.mixpanel = createMixpanel(token);
  }

  /**
   * Mounts the event name with the prefix set in the options
   * @param name
   */
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
   * Dequeues an event.
   * @param index
   */
  dequeue(index: number | 'last' | 'first') {
    switch (index) {
      case 'first':
        this.events.shift();
        break;
      case 'last':
        this.events.pop();
      default: {
        if (Number.isSafeInteger(+index) && this.events[+index]) {
          this.events.splice(+index, 1);
        }
      }
    }
  }

  /**
   * Clear enqueued events
   */
  clearQueue() {
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
          this.clearQueue();
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
  get queueSize() {
    return this.events.length;
  }

  /**
   * The enqueued events description
   */
  get queue() {
    return this.events;
  }

  /**
   * Factories the mixpanel client. If environment variable `MIXPANEL_AUTH_TOKEN` is not set
   * it will throw an error.
   */
  static factory(options?: MixpanelProviderOptions) {
    if (process.env?.MIXPANEL_AUTH_TOKEN) {
      return new this(process.env.MIXPANEL_AUTH_TOKEN, options);
    } else throw new Error('MIXPANEL_AUTH_TOKEN is not set.');
  }
}
