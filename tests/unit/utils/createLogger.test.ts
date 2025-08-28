import { describe, expect, test } from 'bun:test';
import { createConfig } from '../../../src/utils/createConfig';
import { createLogger } from '../../../src/utils/createLogger';
import { mockConfig } from '../../helpers/mockConfig';

describe('createLogger', () => {
    test('should return a pino logger instance', () => {
        const config = createConfig(mockConfig);
        const logger = createLogger(config);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });
});
