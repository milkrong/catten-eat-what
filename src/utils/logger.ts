import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// 初始化 Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

export class Logger {
  constructor(private readonly service: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.service}] INFO:`, message, ...args);
  }

  error(message: string | Error, ...args: any[]): void {
    console.error(`[${this.service}] ERROR:`, message, ...args);
    
    if (message instanceof Error) {
      Sentry.captureException(message);
    } else {
      Sentry.captureMessage(`[${this.service}] ${message}`, {
        level: 'error',
        extra: { args },
      });
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.service}] WARN:`, message, ...args);
    Sentry.captureMessage(`[${this.service}] ${message}`, {
      level: 'warning',
      extra: { args },
    });
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.service}] DEBUG:`, message, ...args);
    }
  }
} 