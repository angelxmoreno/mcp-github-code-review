// deepMergeObjs.ts

// Recursively merge keys
export type DeepMergeObjs<T, U> = {
    [K in keyof T | keyof U]: K extends keyof T
        ? K extends keyof U
            ? T[K] extends PlainObj
                ? U[K] extends PlainObj
                    ? DeepMergeObjs<T[K], U[K]>
                    : U[K]
                : U[K]
            : T[K]
        : K extends keyof U
          ? U[K]
          : never;
};

// Helper type for plain objects
type PlainObj = { [key: string]: unknown };

const isPlainObject = (val: unknown): val is PlainObj => {
    if (val === null || typeof val !== 'object') return false;
    if (Array.isArray(val)) return false;
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
};

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

        if (isPlainObject(tVal) && isPlainObject(sVal)) {
            out[key] = deepMergeObjs(tVal, sVal);
        } else {
            out[key] = sVal;
        }
    }

    return out as DeepMergeObjs<T, U>;
}
