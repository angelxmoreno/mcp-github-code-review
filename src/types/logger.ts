import type { Logger } from 'pino';
import type { InjectionToken } from 'tsyringe';

export enum LogLevel {
    silent = 'silent',
    debug = 'debug',
    info = 'info',
    warn = 'warn',
    error = 'error',
}

export const logLevels = [LogLevel.silent, LogLevel.debug, LogLevel.info, LogLevel.warn, LogLevel.error] as const;

export const AppLogger: InjectionToken<Logger> = 'Logger';
