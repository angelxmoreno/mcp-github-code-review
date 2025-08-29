import { DefaultNamingStrategy, type NamingStrategyInterface, type Table, type View } from 'typeorm';
import { createSafeTableName, toSnakeCaseAcronymSafe } from './utils';

export class InflectionNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    private tableNameCache = new Map<string, string>();

    override tableName(targetName: string, userSpecifiedName?: string): string {
        if (userSpecifiedName) return userSpecifiedName;

        if (!this.tableNameCache.has(targetName)) {
            this.tableNameCache.set(targetName, createSafeTableName(targetName));
        }

        // At this point, it's guaranteed to exist
        return this.tableNameCache.get(targetName) as string;
    }

    override columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
        const baseName = customName ?? propertyName;
        const fullName = customName ? baseName : [...embeddedPrefixes.filter(Boolean), baseName].join('_');
        return toSnakeCaseAcronymSafe(fullName);
    }

    override indexName(tableOrName: Table | View | string, columns: string[], where?: string): string {
        // Use the tableName strategy if we have an object with a .name, otherwise assume string
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;

        // Normalize using the same snake_case & acronym-safe function
        const normalizedTable = toSnakeCaseAcronymSafe(tableName);
        const normalizedColumns = columns.map(toSnakeCaseAcronymSafe).join('_');

        // Optional suffix for partial index
        const whereSuffix = where ? '_partial' : '';

        return `${normalizedTable}_${normalizedColumns}${whereSuffix}`;
    }
    override primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const normalizedTable = toSnakeCaseAcronymSafe(tableName);
        const normalizedColumns = columnNames.map(toSnakeCaseAcronymSafe).join('_');
        return `${normalizedTable}_${normalizedColumns}_pk`;
    }

    override foreignKeyName(
        tableOrName: Table | string,
        columnNames: string[],
        _referencedTablePath?: string,
        _referencedColumnNames?: string[]
    ): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const normalizedTable = toSnakeCaseAcronymSafe(tableName);
        const normalizedColumns = columnNames.map(toSnakeCaseAcronymSafe).join('_');
        return `${normalizedTable}_${normalizedColumns}_fk`;
    }

    override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
        const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
        const normalizedTable = toSnakeCaseAcronymSafe(tableName);
        const normalizedColumns = columnNames.map(toSnakeCaseAcronymSafe).join('_');
        return `${normalizedTable}_${normalizedColumns}_unique`;
    }
}
