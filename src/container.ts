import type { DependencyContainer } from 'tsyringe';
import { appConfig } from './config';
import { createContainer } from './utils/createContainer';

let appContainer: DependencyContainer | undefined;

export function getAppContainer(): DependencyContainer {
    if (!appContainer) {
        appContainer = createContainer(appConfig);
    }
    return appContainer;
}
