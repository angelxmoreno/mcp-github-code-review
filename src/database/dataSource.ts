import 'reflect-metadata';
import { createConfig } from '../utils/createConfig';
import { createDataSource } from './config';

const appConfig = createConfig();

/**
 * Package-level data source for migrations and package internal use
 */
export const AppDataSource = createDataSource(appConfig);
