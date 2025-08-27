import 'reflect-metadata';
import { createContainer } from '../../../src/utils/createContainer';
import { describe, expect, test } from 'bun:test';
import { createConfig } from '../../../src/utils/createConfig';
import { AppLogger } from '../../../src/types/logger';
import type { Logger } from 'pino';

describe('createContainer', () => {
    test('should create a container with a logger registered', () => {
        const config = createConfig();
        const container = createContainer(config);
        const logger = container.resolve<Logger>(AppLogger);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });
});
