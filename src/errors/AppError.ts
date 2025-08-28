import { stringify } from 'safe-stable-stringify';

export class AppError extends Error {
    static errorTpl = 'Error accord: %s with context %s';
    protected errorType: string;
    protected errorContext: Record<string, unknown>;

    constructor(errorType: string, errorContext: Record<string, unknown> = {}, cause: unknown = undefined) {
        const message = AppError.createMessage(errorType, errorContext);
        super(message, { cause });
        this.errorType = errorType;
        this.errorContext = errorContext;
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static createMessage(errorType: string, errorContext: Record<string, unknown>): string {
        try {
            const sourcePreview = stringify(errorContext, null, 2);
            // biome-ignore lint/complexity/noThisInStatic: we need the inherited tpl
            return this.errorTpl.replace('%s', errorType).replace('%s', sourcePreview);
        } catch {
            // Fallback if stringify itself fails
            // biome-ignore lint/complexity/noThisInStatic: we need the inherited tpl
            return this.errorTpl.replace('%s', errorType).replace('%s', '<unserializable errorContext>');
        }
    }
}
