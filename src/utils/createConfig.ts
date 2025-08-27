import { type AppConfig, AppConfigSchema } from '../types/AppConfigSchema.ts';
import type { DeepPartial } from '../types/DeepPartial.ts';
import { NodeEnv } from '../types/env.ts';
import { LogLevel } from '../types/logger.ts';
import { deepMergeObjs } from './deepMergeObjs.ts';

export const createConfig = (overrides: DeepPartial<AppConfig> = {}): AppConfig => {
    const env: NodeEnv = (Bun.env.NODE_ENV ?? NodeEnv.development) as NodeEnv;
    const defaultConfig: AppConfig = {
        github: {
            token: '',
        },
        logger: {
            level: LogLevel.info,
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
