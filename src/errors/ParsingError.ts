import { AppError } from './AppError.ts';

export class ParsingError extends AppError {
    static override errorTpl = 'Can not parse %s using %s';

    constructor(parsingGoal: string, parsingSource: Record<string, unknown>, cause: unknown = undefined) {
        super(parsingGoal, parsingSource, cause);
        Object.setPrototypeOf(this, ParsingError.prototype);
    }
}
