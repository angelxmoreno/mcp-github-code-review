import { stringify } from 'safe-stable-stringify';

export class AppError extends Error {
    protected errorType: string;
    protected errorContext: Record<string, unknown>;

    protected getTemplate(): string {
        return 'Error occurred: "%s" using %s';
    }

    constructor(errorType: string, errorContext: Record<string, unknown> = {}, cause: unknown = undefined) {
        super('placeholder', { cause });
        this.message = AppError.createMessage(errorType, errorContext, this.getTemplate());
        this.errorType = errorType;
        this.errorContext = errorContext;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    protected static createMessage(errorType: string, errorContext: Record<string, unknown>, template: string): string {
        let sourcePreview: string;
        try {
            sourcePreview = stringify(errorContext, null, 2);
        } catch {
            sourcePreview = '<unserializable errorContext>';
        }
        return template.replace('%s', errorType).replace('%s', sourcePreview);
    }
}
