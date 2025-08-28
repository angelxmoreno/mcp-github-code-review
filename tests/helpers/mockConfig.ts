import { LogLevel } from '../../src/types/logger';
import { createConfig } from '../../src/utils/createConfig';
import { createLogger } from '../../src/utils/createLogger';

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
