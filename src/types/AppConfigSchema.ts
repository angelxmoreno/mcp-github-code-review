import { z } from 'zod';
import { nodeEnvs } from './env.ts';
import { logLevels } from './logger.ts';

export const AppConfigSchema = z.object({
    github: z.object({
        token: z
            .string()
            .min(1)
            .regex(/^gh[ps]_[a-zA-Z0-9]{36}$/),
    }),
    logger: z.object({
        level: z.enum(logLevels),
    }),
    nodeEnv: z.object({
        env: z.enum(nodeEnvs),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
