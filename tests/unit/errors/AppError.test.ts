import { describe, expect, test } from 'bun:test';
import { AppError } from '../../../src/errors/AppError';

describe('AppError', () => {
    test('should handle simple objects correctly', () => {
        const error = new AppError('test error', { key: 'value' });

        expect(error.message).toContain('Can not parse test error using');
        expect(error.message).toContain('"key": "value"');
    });

    test('should handle circular references without throwing', () => {
        const circular: Record<string, unknown> = { name: 'test' };
        circular.self = circular;

        const error = new AppError('circular error', circular);

        expect(error.message).toContain('Can not parse circular error using');
        expect(error.message).toContain('[Circular]');
    });

    test('should handle BigInt values', () => {
        const context = {
            id: BigInt(12345),
            name: 'test',
        };

        const error = new AppError('bigint error', context);

        expect(error.message).toContain('Can not parse bigint error using');
        expect(error.message).toContain('12345'); // BigInt should be converted to number/string
        expect(error.message).toContain('"name": "test"');
    });

    test('should handle mixed complex data', () => {
        const complex: Record<string, unknown> = {
            bigInt: BigInt(99999),
            date: new Date('2024-01-01'),
            nested: { deep: { value: 'test' } },
        };
        complex.circular = complex;

        const error = new AppError('complex error', complex);

        expect(error.message).toContain('Can not parse complex error using');
        expect(error.message).toContain('[Circular]');
        expect(error.message).toContain('99999'); // BigInt as number/string
    });
});
