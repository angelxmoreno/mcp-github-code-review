import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { NodeEnv } from '../../../src/types/env';
import { LogLevel } from '../../../src/types/logger';
import { createConfig } from '../../../src/utils/createConfig';
import { mockConfig } from '../../helpers/mockConfig';

describe('createConfig', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
        originalNodeEnv = Bun.env.NODE_ENV;
        Bun.env.NODE_ENV = 'development';
    });

    afterEach(() => {
        Bun.env.NODE_ENV = originalNodeEnv;
    });

    test('should return the default config if no overrides are provided', () => {
        const config = createConfig(mockConfig);
        expect(config.github.token).toBe(mockConfig.github.token);
        expect(config.logger.level).toBe(LogLevel.info);
        expect(config.nodeEnv.env).toBe(NodeEnv.development);
        expect(config.nodeEnv.isDevelopment).toBe(true);
        expect(config.nodeEnv.isTesting).toBe(false);
    });

    test('should overwrite the default config with the provided overrides', () => {
        const overrides = {
            github: {
                token: mockConfig.github.token,
            },
            logger: {
                level: LogLevel.debug,
            },
        };
        const config = createConfig(overrides);
        expect(config.github.token).toBe(mockConfig.github.token);
        expect(config.logger.level).toBe(LogLevel.debug);
    });

    test('should correctly set the nodeEnv based on BUN_ENV', () => {
        Bun.env.NODE_ENV = 'test';
        const config = createConfig(mockConfig);
        expect(config.nodeEnv.env).toBe(NodeEnv.test);
        expect(config.nodeEnv.isDevelopment).toBe(false);
        expect(config.nodeEnv.isTesting).toBe(true);
    });
});
