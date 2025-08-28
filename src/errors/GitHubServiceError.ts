import { AppError } from './AppError';

export class GitHubServiceError extends AppError {
    protected override getTemplate(): string {
        return '%s using %s';
    }

    constructor(errorType: string, errorContext: Record<string, unknown>, cause: unknown = undefined) {
        super(errorType, errorContext, cause);
        Object.setPrototypeOf(this, GitHubServiceError.prototype);
    }
}
