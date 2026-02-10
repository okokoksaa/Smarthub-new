import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Province } from './province.entity';
import { District } from './district.entity';
import { Constituency } from './constituency.entity';
import { Ward } from './ward.entity';

/**
 * User Administrative Scope
 * Links users to their administrative boundaries for Row-Level Security
 *
 * Access Rules:
 * - WDC Member: ward_id specified → can only access their ward
 * - MP/CDFC: constituency_id specified → can access all wards in constituency
 * - District Officer: district_id specified → can access all constituencies/wards in district
 * - Provincial Officer: province_id specified → can access all in province
 * - National Officers: no scope specified → can access all
 */
@Entity('user_administrative_scope')
export class UserAdministrativeScope {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'province_id' })
  provinceId: string;

  @Column({ type: 'uuid', nullable: true, name: 'district_id' })
  districtId: string;

  @Column({ type: 'uuid', nullable: true, name: 'constituency_id' })
  constituencyId: string;

  @Column({ type: 'uuid', nullable: true, name: 'ward_id' })
  wardId: string;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ManyToOne(() => Constituency, { nullable: true })
  @JoinColumn({ name: 'constituency_id' })
  constituency: Constituency;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
