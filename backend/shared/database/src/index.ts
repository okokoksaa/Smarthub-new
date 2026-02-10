/**
 * CDF Smart Hub - Shared Database Module
 * Exports database configuration, entities, and utilities
 */

// Configuration
export * from './database.config';

// Entities
export * from './entities/base.entity';
export * from './entities/user.entity';
export * from './entities/administrative.entity';
export * from './entities/user-scope.entity';
export * from './entities/project.entity';
export * from './entities/milestone.entity';
export * from './entities/budget.entity';
export * from './entities/payment.entity';
export * from './entities/document.entity';
export * from './entities/notification.entity';

// Re-export TypeORM decorators for convenience
export {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
