import 'reflect-metadata';
import { describe, expect, test } from 'bun:test';
import type { Logger } from 'pino';
import { AppLogger } from '../../../src/types/logger.ts';
import { createConfig } from '../../../src/utils/createConfig.ts';
import { createContainer } from '../../../src/utils/createContainer.ts';
import { mockConfig } from '../../helpers/mockConfig.ts';

describe('createContainer', () => {
    test('should create a container with a logger registered', () => {
        const config = createConfig(mockConfig);
        const container = createContainer(config);
        const logger = container.resolve<Logger>(AppLogger);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });
});
