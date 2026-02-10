import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database Configuration for CDF Smart Hub
 * Supports PostgreSQL with Row-Level Security (RLS) for multi-tenancy
 */
export class DatabaseConfig {
  /**
   * Get TypeORM configuration for NestJS
   */
  static getTypeOrmConfig(): TypeOrmModuleOptions {
    const config: TypeOrmModuleOptions = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'cdf_app_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cdf_smarthub',

      // SSL Configuration
      ssl: process.env.DB_SSL_ENABLED === 'true' ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA).toString() : undefined,
      } : false,

      // Connection Pool
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        min: parseInt(process.env.DB_POOL_MIN || '5', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },

      // Entity Management
      entities: [path.join(__dirname, 'entities/**/*.entity{.ts,.js}')],

      // Migration Settings
      migrations: [path.join(__dirname, '../../../database/migrations/**/*{.ts,.js}')],
      migrationsRun: false, // Use manual migrations only

      // Synchronize: NEVER use in production (use migrations only)
      synchronize: process.env.DB_SYNCHRONIZE === 'true', // Use explicit DB_SYNCHRONIZE control

      // Logging
      logging: process.env.DB_LOGGING === 'true',
      logger: 'advanced-console',

      // Naming Strategy - use snake_case for database
      // Commenting out custom naming strategy to use default
      // namingStrategy: undefined,
    };

    return config;
  }

  /**
   * Get DataSource configuration for migrations
   */
  static getDataSourceConfig(): DataSourceOptions {
    return this.getTypeOrmConfig() as DataSourceOptions;
  }

  /**
   * Convert camelCase to snake_case
   */
  private static toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}

/**
 * DataSource for TypeORM CLI (migrations)
 */
export const AppDataSource = new DataSource(DatabaseConfig.getDataSourceConfig());

/**
 * Database Context Manager for Row-Level Security
 * Sets session variables for multi-tenant isolation
 */
export class DatabaseContext {
  /**
   * Set RLS context for current user
   * Must be called at the start of each request
   */
  static async setContext(
    dataSource: DataSource,
    userId: string,
    userRole: string,
    constituencies: string[],
  ): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_user_id = '${userId}'`,
      );

      await queryRunner.query(
        `SET LOCAL app.current_user_role = '${userRole}'`,
      );

      await queryRunner.query(
        `SET LOCAL app.current_user_constituencies = '${constituencies.join(',')}'`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clear RLS context
   */
  static async clearContext(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.query(`RESET app.current_user_id`);
      await queryRunner.query(`RESET app.current_user_role`);
      await queryRunner.query(`RESET app.current_user_constituencies`);
    } finally {
      await queryRunner.release();
    }
  }
}
