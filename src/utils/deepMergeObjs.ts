// deepMergeObjs.ts

// Recursively merge keys
export type DeepMergeObjs<T, U> = {
    [K in keyof T | keyof U]: K extends keyof T
        ? K extends keyof U
            ? DeepMergeObjs<T[K], U[K]>
            : T[K]
        : K extends keyof U
          ? U[K]
          : never;
};

// Helper type for plain objects
type PlainObj = { [key: string]: unknown };

const isObject = (val: unknown): val is PlainObj => typeof val === 'object' && val !== null && !Array.isArray(val);

/**
 * Deeply merges two plain objects.
 * - Recursively merges nested objects.
 * - If a key exists in both, source value overrides target.
 */
export function deepMergeObjs<T extends PlainObj, U extends PlainObj>(target: T, source: U): DeepMergeObjs<T, U> {
    const out: PlainObj = { ...target };

    for (const key of Object.keys(source)) {
        const tVal = target[key];
        const sVal = source[key];

        if (isObject(tVal) && isObject(sVal)) {
            out[key] = deepMergeObjs(tVal, sVal);
        } else {
            out[key] = sVal;
        }
    }

    return out as DeepMergeObjs<T, U>;
}
