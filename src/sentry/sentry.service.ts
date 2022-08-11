import * as Sentry from '@sentry/node';
import { RecordStringAny } from '../shared/types';

const { NODE_ENV, SENTRY_DSN } = process.env;

export class SentryService {
  constructor() {
    Sentry.init({
      environment: NODE_ENV,
      enabled: true,
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0
    });
  }

  logError(err: Error, tags: Record<string, string>, contexts: Record<string, RecordStringAny>) {
    Sentry.captureException(err, {
      tags,
      contexts
    });
  }

  async onApplicationShutdown() {
    await Sentry.flush(5000);
  }
}
