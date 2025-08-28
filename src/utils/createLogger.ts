import pino, { type LoggerOptions } from 'pino';
import type { AppConfig } from '../types/AppConfigSchema';

export const createLogger = (config: AppConfig) => {
    const baseOptions: LoggerOptions = {
        ...config.logger,
    };

    if (config.nodeEnv.isDevelopment) {
        // Development: Pretty-printed logs to stderr
        return pino({
            ...baseOptions,
            transport: {
                target: 'pino-pretty',
                options: {
                    destination: 2, // stderr
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        });
    } else {
        // Production: Structured JSON logs to stderr
        return pino(
            {
                ...baseOptions,
                formatters: {
                    level: (label) => ({ level: label }),
                },
            },
            pino.destination({ dest: 2, sync: false })
        ); // stderr, async for performance
    }
};
