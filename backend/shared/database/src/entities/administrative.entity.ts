import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Province Entity
 */
@Entity('provinces')
@Index(['code'], { unique: true })
export class Province extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  capital?: string;

  @Column({ type: 'integer', nullable: true })
  population?: number;

  @Column({ name: 'area_sqkm', type: 'numeric', precision: 12, scale: 2, nullable: true })
  areaSqkm?: number;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];
}

/**
 * District Entity
 */
@Entity('districts')
@Index(['code'], { unique: true })
@Index(['provinceId'])
export class District extends BaseEntity {
  @Column({ name: 'province_id', type: 'uuid' })
  provinceId: string;

  @ManyToOne(() => Province, (province) => province.districts)
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  headquarters?: string;

  @Column({ type: 'integer', nullable: true })
  population?: number;

  @Column({ name: 'area_sqkm', type: 'numeric', precision: 12, scale: 2, nullable: true })
  areaSqkm?: number;

  @OneToMany(() => Constituency, (constituency) => constituency.district)
  constituencies: Constituency[];
}

/**
 * Constituency Entity
 * PRIMARY TENANT LEVEL - CDF allocation happens at this level
 */
@Entity('constituencies')
@Index(['code'], { unique: true })
@Index(['districtId'])
export class Constituency extends BaseEntity {
  @Column({ name: 'district_id', type: 'uuid' })
  districtId: string;

  @ManyToOne(() => District, (district) => district.constituencies)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  // Member of Parliament (MP) - CDFC Chairperson
  @Column({ name: 'current_mp_name', type: 'varchar', length: 200, nullable: true })
  currentMpName?: string;

  @Column({ name: 'current_mp_party', type: 'varchar', length: 100, nullable: true })
  currentMpParty?: string;

  @Column({ name: 'current_mp_elected_date', type: 'date', nullable: true })
  currentMpElectedDate?: Date;

  // Financial
  @Column({ name: 'annual_cdf_allocation', type: 'numeric', precision: 15, scale: 2, nullable: true })
  annualCdfAllocation?: number;

  @Column({ name: 'current_year_allocation', type: 'numeric', precision: 15, scale: 2, nullable: true })
  currentYearAllocation?: number;

  // Demographics
  @Column({ name: 'registered_voters', type: 'integer', nullable: true })
  registeredVoters?: number;

  @Column({ type: 'integer', nullable: true })
  population?: number;

  // Banking details for CDF account
  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName?: string;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 50, nullable: true })
  bankAccountNumber?: string;

  @Column({ name: 'bank_branch', type: 'varchar', length: 100, nullable: true })
  bankBranch?: string;

  @OneToMany(() => Ward, (ward) => ward.constituency)
  wards: Ward[];
}

/**
 * Ward Entity
 */
@Entity('wards')
@Index(['code'], { unique: true })
@Index(['constituencyId'])
export class Ward extends BaseEntity {
  @Column({ name: 'constituency_id', type: 'uuid' })
  constituencyId: string;

  @ManyToOne(() => Constituency, (constituency) => constituency.wards)
  @JoinColumn({ name: 'constituency_id' })
  constituency: Constituency;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'integer', nullable: true })
  population?: number;

  @Column({ name: 'registered_voters', type: 'integer', nullable: true })
  registeredVoters?: number;

  // Ward Development Committee (WDC) Chairperson
  @Column({ name: 'wdc_chairperson_name', type: 'varchar', length: 200, nullable: true })
  wdcChairpersonName?: string;

  @Column({ name: 'wdc_chairperson_phone', type: 'varchar', length: 20, nullable: true })
  wdcChairpersonPhone?: string;
}
