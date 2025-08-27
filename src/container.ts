import type { DependencyContainer } from 'tsyringe';
import { appConfig } from './config.ts';
import { createContainer } from './utils/createContainer.ts';

export const appContainer: DependencyContainer = createContainer(appConfig);
