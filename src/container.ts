import type { DependencyContainer } from 'tsyringe';
import { appConfig } from './config.ts';
import { createContainer } from './utils/createContainer.ts';

let appContainer: DependencyContainer | undefined;

export function getAppContainer(): DependencyContainer {
    if (!appContainer) {
        appContainer = createContainer(appConfig);
    }
    return appContainer;
}
