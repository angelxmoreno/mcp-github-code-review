import inflection from 'inflection';

export function toSnakeCaseAcronymSafe(str: string): string {
    return str
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase();
}
export function createSafeTableName(targetName: string): string {
    // strip a trailing "Entity" only
    const stripped = targetName.replace(/Entity$/, '');
    const snake = toSnakeCaseAcronymSafe(stripped);
    return inflection.pluralize(snake);
}
