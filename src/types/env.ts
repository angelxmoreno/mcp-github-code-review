export enum NodeEnv {
    development = 'development',
    test = 'test',
    production = 'production',
}

export const nodeEnvs = [NodeEnv.development, NodeEnv.test, NodeEnv.production] as const;
