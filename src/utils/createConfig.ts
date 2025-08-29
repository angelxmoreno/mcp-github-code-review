import get from 'get-object-value';
import { ZodError } from 'zod';
import { type AppConfig, AppConfigSchema } from '../types/AppConfigSchema';
import type { DeepPartial } from '../types/DeepPartial';
import { NodeEnv } from '../types/env';
import { LogLevel } from '../types/logger';
import { deepMergeObjs } from './deepMergeObjs';
import { getSafeConfigValueByPath } from './getSafeConfigValueByPath';

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
        database: {
            path: Bun.env.DB_PATH ?? './db/mcp.sqlite3',
            logging: (Bun.env.DB_LOGGING ?? 'false').toLowerCase() === 'true',
        },
    };
    const merged = deepMergeObjs(defaultConfig, overrides);
    try {
        return AppConfigSchema.parse(merged);
    } catch (e: unknown) {
        if (e instanceof ZodError) {
            e.issues.forEach((issue) => {
                console.error('validation Error', {
                    path: issue.path,
                    message: issue.message,
                    value: get(merged, issue.path as string[]),
                    value2: getSafeConfigValueByPath(merged, issue.path),
                });
            });
        }
        throw e;
    }
};
