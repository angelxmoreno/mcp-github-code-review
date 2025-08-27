import 'reflect-metadata';
import { describe, expect, test } from 'bun:test';
import type { Logger } from 'pino';
import { AppLogger } from '../../../src/types/logger';
import { createConfig } from '../../../src/utils/createConfig';
import { createContainer } from '../../../src/utils/createContainer';

describe('createContainer', () => {
    test('should create a container with a logger registered', () => {
        const config = createConfig();
        const container = createContainer(config);
        const logger = container.resolve<Logger>(AppLogger);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });
});
