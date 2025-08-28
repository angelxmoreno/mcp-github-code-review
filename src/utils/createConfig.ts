import { type AppConfig, AppConfigSchema } from '../types/AppConfigSchema';
import type { DeepPartial } from '../types/DeepPartial';
import { NodeEnv } from '../types/env';
import { LogLevel } from '../types/logger';
import { deepMergeObjs } from './deepMergeObjs';

export const createConfig = (overrides: DeepPartial<AppConfig> = {}): AppConfig => {
    const env: NodeEnv = (Bun.env.NODE_ENV ?? NodeEnv.development) as NodeEnv;
    const defaultConfig: AppConfig = {
        github: {
            token: Bun.env.GITHUB_TOKEN ?? '',
        },
        logger: {
            level: (Bun.env.LOGGER_LEVEL ?? LogLevel.info) as LogLevel,
        },
        nodeEnv: {
            env,
            isDevelopment: env === NodeEnv.development,
            isTesting: env === NodeEnv.test,
        },
    };

    const merged = deepMergeObjs(defaultConfig, overrides);

    return AppConfigSchema.parse(merged);
};
