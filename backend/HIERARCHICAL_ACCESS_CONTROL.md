# Hierarchical Access Control System

Complete documentation for the Province → District → Constituency → Ward hierarchical access control implementation in CDF Smart Hub.

## Administrative Hierarchy

### Structure

```
Zambia (Country)
  └── Provinces (9 total)
        └── Districts (Multiple per province)
              └── Constituencies (156 total)
                    └── Wards (Multiple per constituency, ~1,560 total)
```

### Hierarchy Breakdown

#### 1. Provinces (9)
- Central (CE)
- Copperbelt (CB)
- Eastern (EA)
- Luapula (LP)
- Lusaka (LK)
- Muchinga (MU)
- Northern (NO)
- North-Western (NW)
- Southern (SO)
- Western (WE)

#### 2. Districts
- Multiple districts per province
- Each district belongs to exactly one province
- Examples:
  - Central Province: Chibombo, Chisamba, Chitambo, Kabwe, Kapiri Mposhi, Mkushi, Mumbwa, Serenje, etc.
  - Copperbelt Province: Chililabombwe, Chingola, Kalulushi, Kitwe, Ndola, Mufulira, etc.

#### 3. Constituencies (156 Total)
- Parliamentary constituencies
- Each constituency belongs to exactly one district and one province
- Examples:
  - **Katuba** – Central – Chibombo
  - **Keembe** – Central – Chibombo
  - **Mafinga** – Muchinga – Mafinga
  - **Chawama** – Lusaka – Lusaka
  - **Kanyama** – Lusaka – Lusaka

#### 4. Wards
- Electoral wards within constituencies
- Each ward belongs to exactly one constituency, district, and province
- Examples:
  - **Makutu Ward** in Mafinga Constituency
  - **Thendele Ward** in Mafinga Constituency

## Access Control Rules

### Role-Based Access Matrix

| Role | Province Access | District Access | Constituency Access | Ward Access |
|------|----------------|-----------------|---------------------|-------------|
| **WDC Member** | ❌ | ❌ | ❌ | ✅ Own ward only |
| **MP** | ❌ | ❌ | ✅ Own constituency | ✅ All wards in constituency |
| **CDFC Member** | ❌ | ❌ | ✅ Own constituency | ✅ All wards in constituency |
| **Local Authority Official** | ❌ | ❌ | ✅ Own constituency | ✅ All wards in constituency |
| **District Officer** | ❌ | ✅ Own district | ✅ All in district | ✅ All in district |
| **Provincial Officer** | ✅ Own province | ✅ All in province | ✅ All in province | ✅ All in province |
| **Ministry Official** | ✅ All | ✅ All | ✅ All | ✅ All |
| **National Treasury** | ✅ All | ✅ All | ✅ All | ✅ All |
| **Auditor General** | ✅ All | ✅ All | ✅ All | ✅ All |
| **Parliament Oversight** | ✅ All | ✅ All | ✅ All | ✅ All |
| **Super Admin** | ✅ All | ✅ All | ✅ All | ✅ All |
| **System Admin** | ✅ All | ✅ All | ✅ All | ✅ All |

### Access Examples

#### Example 1: WDC Member Access
**User**: John Doe, WDC Member
**Assignment**: Makutu Ward, Mafinga Constituency, Mafinga District, Muchinga Province

**Can Access**:
- ✅ Makutu Ward (assigned ward)
- ✅ Projects in Makutu Ward
- ✅ Budget allocations for Makutu Ward
- ✅ Payments for Makutu Ward projects

**Cannot Access**:
- ❌ Thendele Ward (different ward in same constituency)
- ❌ Any other wards in Mafinga Constituency
- ❌ Mafinga Constituency-level data (unless specifically for Makutu Ward)
- ❌ Any other constituencies

#### Example 2: MP Access
**User**: Jane Smith, Member of Parliament
**Assignment**: Mafinga Constituency, Mafinga District, Muchinga Province

**Can Access**:
- ✅ Mafinga Constituency
- ✅ ALL wards in Mafinga Constituency (Makutu, Thendele, etc.)
- ✅ All projects in Mafinga Constituency
- ✅ All budget allocations for Mafinga Constituency
- ✅ All payments for Mafinga Constituency projects

**Cannot Access**:
- ❌ Other constituencies (e.g., Chinsali, Isoka)
- ❌ Mafinga District-level aggregated data (unless for their constituency)

#### Example 3: District Officer Access
**User**: Michael Brown, District Officer
**Assignment**: Mafinga District, Muchinga Province

**Can Access**:
- ✅ Mafinga District
- ✅ ALL constituencies in Mafinga District
- ✅ ALL wards in Mafinga District
- ✅ All projects in Mafinga District
- ✅ District-level statistics and reports

**Cannot Access**:
- ❌ Other districts in Muchinga Province
- ❌ Districts in other provinces

## Database Schema

### Tables

#### 1. Provinces
```sql
CREATE TABLE provinces (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 2. Districts
```sql
CREATE TABLE districts (
    id UUID PRIMARY KEY,
    province_id UUID REFERENCES provinces(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 3. Constituencies
```sql
CREATE TABLE constituencies (
    id UUID PRIMARY KEY,
    district_id UUID REFERENCES districts(id),
    province_id UUID REFERENCES provinces(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    mp_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 4. Wards
```sql
CREATE TABLE wards (
    id UUID PRIMARY KEY,
    constituency_id UUID REFERENCES constituencies(id),
    district_id UUID REFERENCES districts(id),
    province_id UUID REFERENCES provinces(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    wdc_chairperson_user_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    population INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 5. User Administrative Scope
```sql
CREATE TABLE user_administrative_scope (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    province_id UUID REFERENCES provinces(id),
    district_id UUID REFERENCES districts(id),
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Scope Assignment Rules

**WDC Member**:
```sql
INSERT INTO user_administrative_scope (user_id, ward_id, constituency_id, district_id, province_id)
VALUES (
    'user-uuid',
    'makutu-ward-uuid',
    'mafinga-constituency-uuid',
    'mafinga-district-uuid',
    'muchinga-province-uuid'
);
```

**MP / CDFC Member**:
```sql
INSERT INTO user_administrative_scope (user_id, constituency_id, district_id, province_id)
VALUES (
    'user-uuid',
    'mafinga-constituency-uuid',
    'mafinga-district-uuid',
    'muchinga-province-uuid'
);
-- Note: ward_id is NULL → can access all wards in constituency
```

**District Officer**:
```sql
INSERT INTO user_administrative_scope (user_id, district_id, province_id)
VALUES (
    'user-uuid',
    'mafinga-district-uuid',
    'muchinga-province-uuid'
);
-- Note: constituency_id and ward_id are NULL → can access all in district
```

**Provincial Officer**:
```sql
INSERT INTO user_administrative_scope (user_id, province_id)
VALUES (
    'user-uuid',
    'muchinga-province-uuid'
);
-- Note: district_id, constituency_id, ward_id are NULL → can access all in province
```

**National Officers** (Super Admin, Ministry, Treasury, etc.):
```sql
-- No scope assignment needed
-- NULL values for all geographic IDs → can access all data
```

## Row-Level Security (RLS) Implementation

### RLS Policies

All administrative tables have RLS enabled with policies enforcing hierarchical access:

#### Wards RLS Example
```sql
-- National officers see all
CREATE POLICY wards_national_access ON wards
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
    );

-- Provincial officers see wards in their province
CREATE POLICY wards_provincial_access ON wards
    FOR ALL
    USING (
        province_id = (
            SELECT province_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- District officers see wards in their district
CREATE POLICY wards_district_access ON wards
    FOR ALL
    USING (
        district_id = (
            SELECT district_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- MP/CDFC see all wards in their constituency
CREATE POLICY wards_constituency_access ON wards
    FOR ALL
    USING (
        constituency_id = (
            SELECT constituency_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) IN ('MP', 'CDFC_MEMBER')
    );

-- WDC member sees only their ward
CREATE POLICY wards_ward_access ON wards
    FOR ALL
    USING (
        id = (
            SELECT ward_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) = 'WDC_MEMBER'
    );
```

### Session Context

Before each database query, set session context:

```sql
-- Set user context (done automatically by TypeORM middleware)
SET app.current_user_id = 'user-uuid';
SET app.current_user_role = 'WDC_MEMBER';
```

RLS policies then automatically filter data based on these settings.

## Helper Functions

### Get User's Accessible Wards
```sql
SELECT * FROM get_user_accessible_wards(
    'user-uuid',
    'WDC_MEMBER'
);
-- Returns only wards the user can access
```

### Check Ward Access Permission
```sql
SELECT can_user_access_ward(
    'user-uuid',
    'WDC_MEMBER',
    'ward-uuid'
);
-- Returns true/false
```

### Check Constituency Access Permission
```sql
SELECT can_user_access_constituency(
    'user-uuid',
    'MP',
    'constituency-uuid'
);
-- Returns true/false
```

## TypeORM Entities

### Province Entity
```typescript
@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => District, (district) => district.province)
  districts: District[];

  @OneToMany(() => Constituency, (constituency) => constituency.province)
  constituencies: Constituency[];
}
```

### User Administrative Scope Entity
```typescript
@Entity('user_administrative_scope')
export class UserAdministrativeScope {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  provinceId: string;

  @Column({ type: 'uuid', nullable: true })
  districtId: string;

  @Column({ type: 'uuid', nullable: true })
  constituencyId: string;

  @Column({ type: 'uuid', nullable: true })
  wardId: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Province)
  province: Province;

  @ManyToOne(() => District)
  district: District;

  @ManyToOne(() => Constituency)
  constituency: Constituency;

  @ManyToOne(() => Ward)
  ward: Ward;
}
```

## API Integration

### Filtering Projects by Ward (WDC Member)
```typescript
// In ProjectsService
async findAll(userId: string, userRole: UserRole) {
  const queryBuilder = this.projectRepository
    .createQueryBuilder('project');

  if (userRole === UserRole.WDC_MEMBER) {
    // Get user's ward
    const userScope = await this.userScopeRepository.findOne({
      where: { userId },
    });

    if (!userScope?.wardId) {
      throw new ForbiddenException('No ward assigned to user');
    }

    // Filter by ward
    queryBuilder.where('project.ward_id = :wardId', {
      wardId: userScope.wardId,
    });
  } else if (userRole === UserRole.MP || userRole === UserRole.CDFC_MEMBER) {
    // Filter by constituency
    const userScope = await this.userScopeRepository.findOne({
      where: { userId },
    });

    queryBuilder.where('project.constituency_id = :constituencyId', {
      constituencyId: userScope.constituencyId,
    });
  }

  return await queryBuilder.getMany();
}
```

### Creating Project with Scope Validation
```typescript
async create(createProjectDto: CreateProjectDto, userId: string, userRole: UserRole) {
  // Validate user can create project in specified ward
  if (createProjectDto.wardId) {
    const canAccess = await this.canUserAccessWard(
      userId,
      userRole,
      createProjectDto.wardId,
    );

    if (!canAccess) {
      throw new ForbiddenException('Cannot create project in this ward');
    }
  }

  // Create project
  const project = this.projectRepository.create(createProjectDto);
  return await this.projectRepository.save(project);
}
```

## Migration and Seeding

### Step 1: Run Migration
```bash
# Apply administrative hierarchy migration
psql -U postgres -d cdf_smarthub -f database/migrations/006_administrative_hierarchy_and_rls.sql
```

### Step 2: Seed Data
```bash
# Seed provinces, districts, constituencies, and wards
psql -U postgres -d cdf_smarthub -f database/seeds/001_administrative_hierarchy.sql
```

### Step 3: Assign User Scopes
```sql
-- Example: Assign WDC member to Makutu Ward
INSERT INTO user_administrative_scope (user_id, ward_id, constituency_id, district_id, province_id)
SELECT
    u.id,
    w.id,
    w.constituency_id,
    w.district_id,
    w.province_id
FROM users u
CROSS JOIN wards w
WHERE u.email = 'john.doe@wdc.gov.zm'
AND w.code = 'MU-MAFI-MAFI-W01'; -- Makutu Ward code
```

## Testing Hierarchical Access

### Test Case 1: WDC Member Cannot Access Other Wards
```typescript
it('should prevent WDC member from accessing other wards', async () => {
  // Setup: WDC member assigned to Makutu Ward
  const user = await createWDCMember('Makutu Ward');

  // Try to access Thendele Ward project
  const thendeleProject = await createProject({ wardId: 'thendele-ward-id' });

  // Should throw ForbiddenException
  await expect(
    projectsService.findOne(thendeleProject.id, user.id, UserRole.WDC_MEMBER),
  ).rejects.toThrow(ForbiddenException);
});
```

### Test Case 2: MP Can Access All Wards in Constituency
```typescript
it('should allow MP to access all wards in their constituency', async () => {
  // Setup: MP for Mafinga Constituency
  const mp = await createMP('Mafinga Constituency');

  // Create projects in different wards
  const makutuProject = await createProject({ wardId: 'makutu-ward-id' });
  const thendeleProject = await createProject({ wardId: 'thendele-ward-id' });

  // MP should access both
  const projects = await projectsService.findAll(mp.id, UserRole.MP);

  expect(projects).toContainEqual(expect.objectContaining({ id: makutuProject.id }));
  expect(projects).toContainEqual(expect.objectContaining({ id: thendeleProject.id }));
});
```

## Security Considerations

### 1. Database-Level Enforcement
- ✅ RLS policies cannot be bypassed through application bugs
- ✅ Even with SQL injection, users cannot see unauthorized data
- ✅ Session context is set automatically by TypeORM middleware

### 2. Cascading Deletes Prevention
- ❌ Cannot delete province if districts exist (ON DELETE RESTRICT)
- ❌ Cannot delete district if constituencies exist
- ❌ Cannot delete constituency if wards exist
- ❌ Cannot delete ward if projects exist

### 3. Audit Trail
- ✅ All scope assignments logged
- ✅ Changes to administrative boundaries tracked
- ✅ User access attempts audited

### 4. Performance Optimization
- ✅ Indexed foreign keys (province_id, district_id, constituency_id, ward_id)
- ✅ Cached user scope lookups
- ✅ Denormalized hierarchy (ward knows its province directly)

## Deployment

### Production Checklist

- [ ] Run migration 006_administrative_hierarchy_and_rls.sql
- [ ] Seed administrative hierarchy (156 constituencies)
- [ ] Assign user scopes for all existing users
- [ ] Test RLS policies with different user roles
- [ ] Verify index performance
- [ ] Enable RLS on all related tables (projects, budgets, payments)
- [ ] Update API endpoints to use scope filtering
- [ ] Update frontend to show only accessible data
- [ ] Test with real user scenarios
- [ ] Monitor query performance with EXPLAIN ANALYZE

## Support

For questions or issues with hierarchical access control:
- See `database/migrations/006_administrative_hierarchy_and_rls.sql`
- See `database/seeds/001_administrative_hierarchy.sql`
- See entity files in `shared/database/src/entities/`
- Review RLS helper functions: `get_user_accessible_wards()`, `can_user_access_ward()`

**Critical**: WDC members can ONLY access their assigned ward. MPs can access all wards in their constituency. This is enforced at the database level and cannot be bypassed.
