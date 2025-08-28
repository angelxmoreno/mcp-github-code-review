import { AppError } from './AppError.ts';

export class GitHubServiceError extends AppError {
    static override errorTpl = '%s using %s';

    constructor(parsingGoal: string, parsingSource: Record<string, unknown>, cause: unknown = undefined) {
        super(parsingGoal, parsingSource, cause);
        Object.setPrototypeOf(this, GitHubServiceError.prototype);
    }
}
