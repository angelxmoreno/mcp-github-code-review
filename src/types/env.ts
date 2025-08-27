export enum NodeEnv {
    development = 'development',
    test = 'test',
    production = 'production',
}

export const nodeEnvs = Object.values(NodeEnv) as readonly NodeEnv[];
