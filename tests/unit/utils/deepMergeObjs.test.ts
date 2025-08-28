/** biome-ignore-all lint/suspicious/noExplicitAny: we use the any type only for testing */
import { describe, expect, test } from 'bun:test';
import { deepMergeObjs } from '../../../src/utils/deepMergeObjs.ts';

describe('deepMergeObjs', () => {
    test('should merge non-nested objects', () => {
        const target = { a: 1, b: 2 };
        const source = { c: 3, d: 4 };
        const expected = { a: 1, b: 2, c: 3, d: 4 };
        expect(deepMergeObjs(target, source)).toEqual(expected);
    });

    test('should overwrite target properties with source properties', () => {
        const target = { a: 1, b: 2 };
        const source = { b: 3, c: 4 };
        const expected = { a: 1, b: 3, c: 4 };
        expect(deepMergeObjs(target, source)).toEqual(expected);
    });

    test('should merge nested objects', () => {
        const target = { a: { b: 1 } };
        const source = { a: { c: 2 } };
        const expected = { a: { b: 1, c: 2 } };
        expect(deepMergeObjs(target, source)).toEqual(expected);
    });

    test('should overwrite nested properties', () => {
        const target = { a: { b: 1 } };
        const source = { a: { b: 2 } };
        const expected = { a: { b: 2 } };
        expect(deepMergeObjs(target, source)).toEqual(expected);
    });

    test('should handle complex nested objects', () => {
        const target = { a: { b: { c: 1 } }, d: 4 };
        const source = { a: { b: { e: 2 } }, f: 5 };
        const expected = { a: { b: { c: 1, e: 2 } }, d: 4, f: 5 };
        expect(deepMergeObjs(target, source)).toEqual(expected);
    });

    test('should not modify the original objects', () => {
        const target = { a: 1 };
        const source = { b: 2 };
        deepMergeObjs(target, source);
        expect(target).toEqual({ a: 1 });
        expect(source).toEqual({ b: 2 });
    });

    test('should overwrite arrays instead of merging', () => {
        const target = { a: [1, 2], nested: { arr: [3] } };
        const source = { a: [3, 4], nested: { arr: [4] } };
        const result = deepMergeObjs(target, source);
        expect(result).toEqual({ a: [3, 4], nested: { arr: [4] } });
    });

    test('should not allow prototype pollution', () => {
        const pollutedBefore = ({} as any).polluted;
        expect(pollutedBefore).toBeUndefined();
        const source = JSON.parse('{"__proto__":{"polluted":"yes"}}');
        deepMergeObjs({}, source as any);
        expect(({} as any).polluted).toBeUndefined();
    });

    test('should treat non-plain objects as values (overwrite)', () => {
        const d1 = new Date(0);
        const d2 = new Date(1);
        const result = deepMergeObjs({ a: d1 }, { a: d2 });
        expect(result.a).toBe(d2);
    });
});
