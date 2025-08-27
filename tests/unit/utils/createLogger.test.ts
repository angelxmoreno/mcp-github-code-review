
import { createLogger } from '../../../src/utils/createLogger';
import { describe, expect, test } from 'bun:test';
import { createConfig } from '../../../src/utils/createConfig';

describe('createLogger', () => {
    test('should return a pino logger instance', () => {
        const config = createConfig();
        const logger = createLogger(config);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });
});
