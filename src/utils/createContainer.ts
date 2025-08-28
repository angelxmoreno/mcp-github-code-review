import type { Logger } from 'pino';
import { container, type DependencyContainer, instanceCachingFactory } from 'tsyringe';
import type { AppConfig } from '../types/AppConfigSchema';
import { AppLogger } from '../types/logger';
import { createLogger } from './createLogger';

export const createContainer = (config: AppConfig): DependencyContainer => {
    const appContainer = container.createChildContainer();

    appContainer.register<Logger>(AppLogger, {
        useFactory: instanceCachingFactory<Logger>(() => createLogger(config)),
    });

    return appContainer;
};
