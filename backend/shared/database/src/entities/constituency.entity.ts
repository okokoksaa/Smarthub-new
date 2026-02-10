import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Province } from './province.entity';
import { District } from './district.entity';
import { Ward } from './ward.entity';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('constituencies')
export class Constituency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'district_id' })
  districtId: string;

  @Column({ type: 'uuid', name: 'province_id' })
  provinceId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'uuid', nullable: true, name: 'mp_user_id' })
  mpUserId: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', nullable: true })
  population: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'area_sq_km' })
  areaSqKm: number;

  // Relations
  @ManyToOne(() => Province, (province) => province.constituencies)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => District, (district) => district.constituencies)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mp_user_id' })
  mp: User;

  @OneToMany(() => Ward, (ward) => ward.constituency)
  wards: Ward[];

  @OneToMany(() => Project, (project) => project.constituency)
  projects: Project[];

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
