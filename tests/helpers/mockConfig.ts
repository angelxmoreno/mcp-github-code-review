import { LogLevel } from '../../src/types/logger.ts';
import { createConfig } from '../../src/utils/createConfig.ts';
import { createLogger } from '../../src/utils/createLogger.ts';

export const mockConfig = {
    github: {
        token: 'ghp_abcdefghijklmnopqrstuvwxwz0123456789',
    },
    logger: {
        level: LogLevel.info,
    },
};

export const testConfig = createConfig({
    ...mockConfig,
    logger: {
        level: LogLevel.silent,
    },
});
export const testLogger = createLogger(testConfig);
