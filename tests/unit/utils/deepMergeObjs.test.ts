import { describe, expect, test } from 'bun:test';
import { deepMergeObjs } from '../../../src/utils/deepMergeObjs';

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
});
