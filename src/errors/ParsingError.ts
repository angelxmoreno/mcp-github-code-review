import { AppError } from './AppError';

export class ParsingError extends AppError {
    protected override getTemplate(): string {
        return 'Cannot parse %s using %s';
    }

    constructor(parsingGoal: string, parsingSource: Record<string, unknown>, cause: unknown = undefined) {
        super(parsingGoal, parsingSource, cause);
        Object.setPrototypeOf(this, ParsingError.prototype);
    }
}
