import { z } from 'zod';
import { nodeEnvs } from './env.ts';
import { logLevels } from './logger.ts';

export const AppConfigSchema = z.object({
    github: z.object({
        token: z.string(),
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
