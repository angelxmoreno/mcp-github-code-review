import { DataSource, type DataSourceOptions } from 'typeorm';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';
import type { AppConfig } from '../types/AppConfigSchema';
import { createLogger } from '../utils/createLogger';
import { InflectionNamingStrategy } from './core/InflectionNamingStrategy';
import { AppDataSource } from './dataSource';

/**
 * Merge package default config with app-specific overrides
 */
export function createDataSourceOptions(appConfig: AppConfig): DataSourceOptions {
    const typeormLogger = new TypeOrmPinoLogger(createLogger(appConfig));

    return {
        type: 'sqlite',
        database: appConfig.database.path,
        ...appConfig.database,
        synchronize: false,
        entities: [`${__dirname}/entities/*.ts`],
        migrations: [`${__dirname}/migrations/*.ts`],
        migrationsTableName: 'typeorm_migrations',
        migrationsRun: true,
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    };
}

/**
 * Create a DataSource with app-specific configuration
 * Apps should use this instead of the package's AppDataSource
 */
export function createDataSource(appConfig: AppConfig): DataSource {
    const dataSourceOptions = createDataSourceOptions(appConfig);
    return new DataSource(dataSourceOptions);
}

/**
 * Initialize and return a database connection
 * Apps should use this with their own configuration
 */
export async function initializeDatabase(dataSource?: DataSource): Promise<DataSource> {
    const ds = dataSource ?? AppDataSource;

    try {
        if (!ds.isInitialized) {
            await ds.initialize();
            console.log(`✅ Database connection initialized (${ds.options.database})`);
        }
        return ds;
    } catch (error) {
        console.error('❌ Error during database initialization:', error);
        throw error;
    }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabase(dataSource?: DataSource): Promise<void> {
    const ds = dataSource ?? AppDataSource;

    try {
        if (ds.isInitialized) {
            await ds.destroy();
            console.log(`✅ Database connection closed (${ds.options.database})`);
        }
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
        throw error;
    }
}
