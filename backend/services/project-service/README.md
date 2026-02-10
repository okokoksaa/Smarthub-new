# Project Service

Complete CDF project lifecycle management service with approval workflows, milestone tracking, and progress monitoring.

## Features

### Project Management
- ✅ Complete CRUD operations with pagination and filtering
- ✅ Project creation with automatic code generation
- ✅ Multi-level filtering (status, type, constituency, ward, fiscal year)
- ✅ Full-text search across title, description, and project code
- ✅ Project statistics and reporting

### Project Lifecycle
- ✅ **DRAFT** → **SUBMITTED** → **UNDER_REVIEW** → **APPROVED** → **BUDGETED** → **IN_PROGRESS** → **COMPLETED** → **CLOSED**
- ✅ Dual approval workflow (CDFC + TAC)
- ✅ Status transitions with validation
- ✅ Rejection handling with reason tracking

### Milestone Management
- ✅ Create, update, delete milestones
- ✅ Milestone sequencing with percentage weighting
- ✅ Automatic project progress calculation
- ✅ Milestone completion with evidence upload
- ✅ Verification workflow
- ✅ Deliverables tracking

### Monitoring & Tracking
- ✅ Progress percentage tracking
- ✅ Budget allocation and cost tracking
- ✅ Beneficiary counting with demographics
- ✅ Quality rating system
- ✅ Inspection tracking
- ✅ Overdue detection
- ✅ Over-budget flagging

## Project Types

| Type | Description |
|------|-------------|
| INFRASTRUCTURE | Roads, bridges, buildings |
| EDUCATION | Schools, libraries, training centers |
| HEALTH | Clinics, hospitals, health posts |
| WATER_AND_SANITATION | Boreholes, water systems, sanitation |
| AGRICULTURE | Irrigation, farm inputs, storage |
| SOCIAL_WELFARE | Community centers, welfare programs |
| SPORTS_AND_RECREATION | Sports facilities, playgrounds |
| ECONOMIC_EMPOWERMENT | Microfinance, business development |
| ENVIRONMENT | Tree planting, waste management |
| GOVERNANCE | Capacity building, civic education |
| OTHER | Other project types |

## Project Status Flow

```
DRAFT
  ↓ (submit)
SUBMITTED
  ↓ (CDFC review)
UNDER_REVIEW
  ↓ (CDFC approve)
UNDER_REVIEW
  ↓ (TAC approve)
APPROVED
  ↓ (budget allocated)
BUDGETED
  ↓ (start execution)
IN_PROGRESS
  ↓ (complete)
COMPLETED
  ↓ (close)
CLOSED

(Any stage can be rejected → REJECTED)
(Can be cancelled → CANCELLED)
```

## API Endpoints

### Project CRUD (7 endpoints)

```
POST   /api/v1/projects              Create new project
GET    /api/v1/projects              List projects (with filters)
GET    /api/v1/projects/statistics   Get project statistics
GET    /api/v1/projects/:id          Get project by ID
GET    /api/v1/projects/code/:code   Get project by code
PATCH  /api/v1/projects/:id          Update project
DELETE /api/v1/projects/:id          Cancel project (soft delete)
```

### Project Lifecycle (7 endpoints)

```
POST   /api/v1/projects/:id/submit        Submit for approval
POST   /api/v1/projects/:id/cdfc-approve  CDFC approval/rejection
POST   /api/v1/projects/:id/tac-approve   TAC approval/rejection
POST   /api/v1/projects/:id/start         Start execution
PATCH  /api/v1/projects/:id/progress      Update progress
POST   /api/v1/projects/:id/complete      Mark as completed
```

### Milestone Management (9 endpoints)

```
POST   /api/v1/milestones                         Create milestone
GET    /api/v1/milestones/project/:projectId      List project milestones
GET    /api/v1/milestones/project/:projectId/stats  Milestone statistics
GET    /api/v1/milestones/:id                     Get milestone by ID
PATCH  /api/v1/milestones/:id                     Update milestone
DELETE /api/v1/milestones/:id                     Delete milestone
POST   /api/v1/milestones/:id/start               Start milestone
POST   /api/v1/milestones/:id/complete            Complete milestone
POST   /api/v1/milestones/:id/verify              Verify milestone
```

**Total: 23 endpoints**

## Example Requests

### Create Project

```bash
curl -X POST http://localhost:3002/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Construction of Community Health Clinic",
    "description": "Modern health clinic with maternity ward and pharmacy",
    "projectType": "HEALTH",
    "priority": "HIGH",
    "constituencyId": "123e4567-e89b-12d3-a456-426614174000",
    "wardId": "123e4567-e89b-12d3-a456-426614174001",
    "location": "Kanyama Compound, Plot 123",
    "estimatedCost": 500000,
    "fiscalYear": 2024,
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "durationMonths": 12,
    "targetBeneficiaries": 5000,
    "proposalDocumentUrl": "https://storage.example.com/proposals/proj123.pdf"
  }'
```

### List Projects with Filters

```bash
curl "http://localhost:3002/api/v1/projects?\
page=1&\
limit=10&\
status=IN_PROGRESS&\
projectType=HEALTH&\
constituencyId=123e4567-e89b-12d3-a456-426614174000&\
fiscalYear=2024&\
search=clinic" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Project for Approval

```bash
curl -X POST http://localhost:3002/api/v1/projects/{id}/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### CDFC Approval

```bash
curl -X POST http://localhost:3002/api/v1/projects/{id}/cdfc-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "approved": true,
    "notes": "Project aligns with constituency development priorities"
  }'
```

### Update Progress

```bash
curl -X PATCH http://localhost:3002/api/v1/projects/{id}/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "progressPercentage": 45.5,
    "notes": "Foundation completed, starting walls",
    "actualCost": 250000,
    "actualBeneficiaries": 2500,
    "qualityRating": 4.5
  }'
```

### Create Milestone

```bash
curl -X POST http://localhost:3002/api/v1/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Foundation and structural work",
    "description": "Complete foundation excavation and concrete pouring",
    "sequenceNumber": 1,
    "percentageWeight": 25,
    "dueDate": "2024-03-31",
    "budgetedAmount": 125000,
    "deliverables": [
      {
        "description": "Foundation slab",
        "quantity": 1,
        "unit": "sq meters",
        "completed": false
      }
    ]
  }'
```

### Complete Milestone

```bash
curl -X POST http://localhost:3002/api/v1/milestones/{id}/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "completionDate": "2024-03-25",
    "actualCost": 120000,
    "evidenceDocuments": [
      {
        "url": "https://storage.example.com/photos/milestone1_photo1.jpg",
        "type": "photo"
      }
    ],
    "notes": "Foundation completed ahead of schedule"
  }'
```

## Project Code Format

Format: `CDF-[CONST_CODE]-[YEAR]-[SEQUENCE]`

Example: `CDF-123E4567-24-0001`

- **CONST_CODE**: First 8 characters of constituency UUID (uppercase)
- **YEAR**: Last 2 digits of fiscal year
- **SEQUENCE**: 4-digit sequence number (increments per constituency per year)

## Business Rules

### Project Creation
- Project code automatically generated
- Status defaults to DRAFT
- Progress defaults to 0%
- Validates start date < end date

### Project Submission
- Requires proposal document URL
- Only DRAFT projects can be submitted
- Changes status to SUBMITTED

### CDFC Approval
- Can approve or reject
- Rejection sets status to REJECTED with reason
- Approval sets cdfcApproved = true, status = UNDER_REVIEW

### TAC Approval
- Requires CDFC approval first
- Can approve or reject
- Approval sets tacApproved = true, status = APPROVED
- Rejection sets status to REJECTED

### Project Execution
- Only BUDGETED projects can be started
- Sets actualStartDate
- Changes status to IN_PROGRESS

### Progress Updates
- Only for IN_PROGRESS projects
- Tracks actual cost, beneficiaries, quality rating
- Auto-flags if over budget
- Auto-flags if overdue

### Project Completion
- Only IN_PROGRESS projects can be completed
- Requires 100% progress
- Sets actualEndDate, isCompleted = true
- Status changes to COMPLETED

### Milestone Management
- Sequence numbers must be unique per project
- Total percentage weight cannot exceed 100%
- Completed milestones cannot be updated/deleted
- Completing milestones automatically updates project progress

## Data Models

### Project Entity

Key fields:
- projectCode (unique, auto-generated)
- title, description, projectType, priority
- constituencyId, wardId, location, coordinates
- estimatedCost, actualCost, budgetAllocated, amountDisbursed
- fiscalYear
- startDate, endDate, actualStartDate, actualEndDate
- status, progressPercentage
- cdfcApproved, cdfcApprovedBy, cdfcApprovedAt
- tacApproved, tacApprovedBy, tacApprovedAt
- targetBeneficiaries, actualBeneficiaries
- projectManagerId, monitoringOfficerId
- contractorId, contractorName, contractNumber

Computed properties:
- isOnTrack, budgetUtilizationRate, costVariance
- scheduleVariance, beneficiaryReachRate

### Milestone Entity

Key fields:
- projectId, title, description
- sequenceNumber, percentageWeight
- dueDate, completionDate
- status, isCompleted, isDelayed
- budgetedAmount, actualCost
- deliverables (jsonb)
- verified, verifiedBy, verifiedAt
- evidenceDocuments (jsonb)

Computed properties:
- daysUntilDue, daysOverdue, costVariance

## Event Emissions

The service emits events for integration with other services:

### Project Events
- `project.created`
- `project.updated`
- `project.submitted`
- `project.cdfc_decision`
- `project.tac_decision`
- `project.started`
- `project.progress_updated`
- `project.completed`
- `project.cancelled`

### Milestone Events
- `milestone.created`
- `milestone.updated`
- `milestone.started`
- `milestone.completed`
- `milestone.verified`
- `milestone.deleted`

## Service Architecture

```
ProjectsController
└── ProjectsService
    ├── Project CRUD
    ├── Lifecycle management
    ├── Approval workflows
    ├── Progress tracking
    └── Statistics

MilestonesController
└── MilestonesService
    ├── Milestone CRUD
    ├── Progress tracking
    ├── Verification workflow
    └── Auto project progress update
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Start Service

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Build

```bash
pnpm run build
```

## Environment Variables

```env
# Service Configuration
PROJECT_SERVICE_PORT=3002
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_dev_password
DB_DATABASE=cdf_smarthub
```

## Dependencies

### Core
- **@nestjs/common** - NestJS core
- **@nestjs/typeorm** - TypeORM integration
- **@nestjs/event-emitter** - Event handling
- **typeorm** - ORM for database
- **class-validator** - DTO validation
- **class-transformer** - DTO transformation

## Integration Points

### Finance Service (Future)
- Budget allocation
- Payment tracking
- Contractor payments

### Document Service (Future)
- Proposal storage
- Contract storage
- Completion certificates
- Milestone evidence

### Audit Service (Future)
- All project lifecycle events
- Approval tracking
- Progress tracking

### Notification Service (Future)
- Approval notifications
- Progress alerts
- Deadline reminders
- Completion notifications

## Production Readiness

### Ready ✅
- [x] Complete CRUD operations
- [x] Lifecycle management
- [x] Approval workflows
- [x] Milestone tracking
- [x] Progress monitoring
- [x] Input validation
- [x] Error handling
- [x] Event emissions
- [x] API documentation
- [x] Database entities

### Pending ⏳
- [ ] Automated tests
- [ ] Performance optimization
- [ ] Caching (Redis)
- [ ] File upload handling
- [ ] GIS coordinate validation

## TODO

- [ ] Implement budget allocation endpoint
- [ ] Add contractor assignment workflow
- [ ] Implement inspection scheduling
- [ ] Add project closure workflow
- [ ] Implement project templates
- [ ] Add bulk import functionality
- [ ] Implement project cloning
- [ ] Add project comparison reports
- [ ] Implement project risk assessment
- [ ] Add project photo gallery

## Support

For questions or issues, refer to:
- Main project README: `../../README.md`
- Getting Started Guide: `../../GETTING_STARTED.md`
- API Documentation: http://localhost:3002/api/docs (when running)
