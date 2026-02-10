import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user.entity';

export const DatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres_dev_password'),
  database: process.env.DB_DATABASE || 'cdf_smarthub',
  entities: [User],
  synchronize: false,
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};