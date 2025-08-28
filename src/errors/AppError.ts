export class AppError extends Error {
    static errorTpl = 'Can not parse %s using %s';
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
        const sourcePreview = JSON.stringify(errorContext, null, 2);
        // biome-ignore lint/complexity/noThisInStatic: we need the inherited tpl
        return this.errorTpl.replace('%s', errorType).replace('%s', sourcePreview);
    }
}
