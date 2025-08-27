import type { Logger } from 'pino';
import { container, type DependencyContainer, instanceCachingFactory } from 'tsyringe';
import type { AppConfig } from '../types/AppConfigSchema.ts';
import { AppLogger } from '../types/logger.ts';
import { createLogger } from './createLogger.ts';

export const createContainer = (config: AppConfig): DependencyContainer => {
    const appContainer = container.createChildContainer();

    appContainer.register<Logger>(AppLogger, {
        useFactory: instanceCachingFactory<Logger>(() => createLogger(config)),
    });

    return appContainer;
};
