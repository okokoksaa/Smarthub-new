import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Province } from './province.entity';
import { District } from './district.entity';
import { Constituency } from './constituency.entity';
import { User } from './user.entity';

@Entity('wards')
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'constituency_id' })
  constituencyId: string;

  @Column({ type: 'uuid', name: 'district_id' })
  districtId: string;

  @Column({ type: 'uuid', name: 'province_id' })
  provinceId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({ type: 'uuid', nullable: true, name: 'wdc_chairperson_user_id' })
  wdcChairpersonUserId: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', nullable: true })
  population: number;

  // Relations
  @ManyToOne(() => Province, (province) => province.wards)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => District, (district) => district.wards)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ManyToOne(() => Constituency, (constituency) => constituency.wards)
  @JoinColumn({ name: 'constituency_id' })
  constituency: Constituency;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'wdc_chairperson_user_id' })
  wdcChairperson: User;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
