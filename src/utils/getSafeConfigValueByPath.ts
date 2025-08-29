import get from 'get-object-value';
import type { $ZodIssueBase } from 'zod/v4/core';
import type { AppConfig } from '../types/AppConfigSchema';
import type { DeepPartial } from '../types/DeepPartial';

type Path = $ZodIssueBase['path'] | string[];
const redacted = ['token'];

export const getSafeConfigValueByPath = (config: DeepPartial<AppConfig>, path: Path) => {
    const pathStringArray = path as string[];
    const key = String(pathStringArray.at(-1) ?? '').toLowerCase();
    return redacted.includes(key) ? '<redacted>' : get(config, pathStringArray);
};
