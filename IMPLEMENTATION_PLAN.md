# CDF Smart Hub - Full Module Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for fully developing all modules of the CDF Smart Hub system. The project is a comprehensive Constituency Development Fund management system for Zambia with 42 frontend pages, 11 backend microservices, and a PostgreSQL database with 25+ tables.

**Current State:** ~90% complete (Backend API Gateway complete, Frontend hooks updated)
**Target:** 100% production-ready

---

## Project Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  React 18 + TypeScript + Vite + TanStack Query + Shadcn UI          │
│  42 Pages | 72 Components | 18 Hooks                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (NestJS)                          │
│  Port 3000 | JWT Auth | RBAC | Swagger Docs                         │
│  ✅ Auth Module (Complete) - JWT, RBAC, Guards                       │
│  ✅ Payments Module (Complete) - Two-Panel Authorization             │
│  ✅ Projects Module (Complete) - Full Workflow                       │
│  ✅ Budgets Module (Complete) - Allocation & Tracking                │
│  ✅ Committees Module (Complete) - CDFC/TAC/WDC Management           │
│  ✅ Documents Module (Complete) - Upload, Verify, Immutable          │
│  ✅ Reports Module (Complete) - Analytics & Reporting                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES (11 Total)                          │
│  ✅ Finance Service (Partial)    ✅ Workflow Service (Complete)     │
│  ✅ User Service (Partial)       ✅ AI Service (Complete)           │
│  ✅ Audit Service (Partial)      ⏳ Integration Service (Pending)   │
│  ✅ Document Service (Partial)   ✅ WDC Service (Partial)           │
│  ✅ Notification Service (Partial)                                   │
│  ✅ Project Service (Partial)                                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                           │
│  25+ Tables | RLS Policies | Triggers | Functions                   │
│  Enum Types: app_role, project_status, payment_status, etc.         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend NPM Fix & Infrastructure Setup

### 1.1 Fix Backend Dependencies
**Priority:** CRITICAL (Blocker)
**Effort:** 30 minutes

```bash
cd backend/services/api-gateway
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 1.2 Environment Configuration
Create `.env` file in `backend/services/api-gateway/`:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://yabmrdsavbrcfreowygn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
JWT_SECRET=<jwt_secret>
```

---

## Phase 2: API Gateway Module Development

### 2.1 Projects Module
**Priority:** HIGH
**Dependencies:** Payments Module pattern

#### Files to Create:
```
backend/services/api-gateway/src/projects/
├── projects.module.ts
├── projects.controller.ts
├── projects.service.ts
└── dto/
    ├── create-project.dto.ts
    ├── update-project.dto.ts
    ├── submit-project.dto.ts
    ├── approve-project.dto.ts
    └── reject-project.dto.ts
```

#### API Endpoints:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/projects` | List projects with filters | All authenticated |
| GET | `/projects/:id` | Get project details | All authenticated |
| POST | `/projects` | Create new project | cdfc_member, wdc_member, citizen |
| PATCH | `/projects/:id` | Update project | Project owner, cdfc_chair |
| POST | `/projects/:id/submit` | Submit for CDFC review | Project owner |
| POST | `/projects/:id/cdfc-approve` | CDFC Chair approval | cdfc_chair |
| POST | `/projects/:id/tac-appraise` | TAC technical appraisal | tac_chair, tac_member |
| POST | `/projects/:id/plgo-approve` | PLGO final approval | plgo |
| POST | `/projects/:id/reject` | Reject project | cdfc_chair, plgo |
| PATCH | `/projects/:id/progress` | Update progress | cdfc_chair, finance_officer |
| POST | `/projects/:id/complete` | Mark as complete | plgo |

#### Workflow State Machine:
```
draft → submitted → cdfc_review → tac_appraisal → plgo_review → approved → implementation → completed
                 ↘                            ↙
                        rejected/cancelled
```

### 2.2 Budgets Module
**Priority:** HIGH

#### Files to Create:
```
backend/services/api-gateway/src/budgets/
├── budgets.module.ts
├── budgets.controller.ts
├── budgets.service.ts
└── dto/
    ├── create-budget.dto.ts
    ├── update-budget.dto.ts
    └── approve-budget.dto.ts
```

#### API Endpoints:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/budgets` | List budgets by fiscal year | All authenticated |
| GET | `/budgets/:id` | Get budget details | All authenticated |
| GET | `/budgets/constituency/:id` | Get constituency budget | All authenticated |
| POST | `/budgets` | Create budget allocation | ministry_official, super_admin |
| PATCH | `/budgets/:id` | Update budget | ministry_official, super_admin |
| POST | `/budgets/:id/approve` | Approve budget | ministry_official |
| GET | `/budgets/analytics` | Budget utilization analytics | All authenticated |

### 2.3 Committees & Governance Module
**Priority:** MEDIUM

#### Files to Create:
```
backend/services/api-gateway/src/committees/
├── committees.module.ts
├── committees.controller.ts
├── committees.service.ts
├── meetings.controller.ts
├── meetings.service.ts
└── dto/
    ├── create-committee.dto.ts
    ├── add-member.dto.ts
    ├── create-meeting.dto.ts
    ├── record-attendance.dto.ts
    └── approve-minutes.dto.ts
```

#### API Endpoints:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/committees` | List committees | All authenticated |
| POST | `/committees` | Create committee | plgo, ministry_official |
| POST | `/committees/:id/members` | Add member | cdfc_chair, plgo |
| DELETE | `/committees/:id/members/:userId` | Remove member | cdfc_chair, plgo |
| GET | `/meetings` | List meetings | All authenticated |
| POST | `/meetings` | Schedule meeting | cdfc_chair, tac_chair |
| POST | `/meetings/:id/attendance` | Record attendance | cdfc_chair |
| POST | `/meetings/:id/minutes` | Upload minutes | cdfc_chair |
| POST | `/meetings/:id/approve-minutes` | Approve minutes | cdfc_chair |

### 2.4 Documents Module
**Priority:** MEDIUM

#### Files to Create:
```
backend/services/api-gateway/src/documents/
├── documents.module.ts
├── documents.controller.ts
├── documents.service.ts
└── dto/
    ├── upload-document.dto.ts
    ├── update-document.dto.ts
    └── verify-document.dto.ts
```

#### API Endpoints:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/documents` | List documents | All authenticated |
| GET | `/documents/:id` | Get document details | All authenticated |
| POST | `/documents/upload` | Upload document | All with constituency access |
| DELETE | `/documents/:id` | Delete document | super_admin (non-immutable only) |
| POST | `/documents/:id/immutable` | Make immutable | cdfc_chair, plgo |
| GET | `/documents/verify/:hash` | Public verification | Public |

### 2.5 Reports & Analytics Module
**Priority:** MEDIUM

#### Files to Create:
```
backend/services/api-gateway/src/reports/
├── reports.module.ts
├── reports.controller.ts
├── reports.service.ts
└── dto/
    └── generate-report.dto.ts
```

#### API Endpoints:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/reports/constituency/:id` | Constituency report | All authenticated |
| GET | `/reports/financial` | Financial summary | finance_officer, auditor |
| GET | `/reports/projects` | Project status report | All authenticated |
| GET | `/reports/payments` | Payment analytics | finance_officer, auditor |
| GET | `/reports/compliance` | Compliance dashboard | auditor, plgo |
| POST | `/reports/generate` | Generate custom report | All authenticated |
| GET | `/reports/export/:id` | Export report (PDF/Excel) | All authenticated |

---

## Phase 3: Frontend Hook Updates

### 3.1 Update useProjects Hook
Convert from Supabase direct calls to API Gateway:

```typescript
// New API-based mutations
useCreateProject()
useUpdateProject()
useSubmitProject()
useCDFCApproveProject()
useTACAppraiseProject()
usePLGOApproveProject()
useRejectProject()
useUpdateProgress()
useCompleteProject()
```

### 3.2 Update usePayments Hook
Already has API endpoint structure, needs mutation hooks:

```typescript
useCreatePayment()
useApprovePanelA()
useApprovePanelB()
useDisbursePayment()
```

### 3.3 Update useBudgets Hook
Add API-based operations:

```typescript
useCreateBudget()
useUpdateBudget()
useApproveBudget()
useBudgetAnalytics()
```

### 3.4 Create useCommittees Hook
```typescript
useCommittees()
useCommittee()
useCreateCommittee()
useAddMember()
useRemoveMember()
useMeetings()
useScheduleMeeting()
useRecordAttendance()
useApproveMinutes()
```

---

## Phase 4: Microservices Completion

### 4.1 Workflow Service (NEW)
**Purpose:** Manage project/payment state machine transitions

#### Features:
- State machine definitions for projects and payments
- Automatic notifications on state changes
- Event sourcing for audit trail
- Webhook support for external integrations

#### Files:
```
backend/services/workflow-service/
├── src/
│   ├── workflow/
│   │   ├── workflow.module.ts
│   │   ├── workflow.service.ts
│   │   ├── state-machine/
│   │   │   ├── project.state-machine.ts
│   │   │   └── payment.state-machine.ts
│   │   └── events/
│   │       └── workflow.events.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

### 4.2 AI Advisory Service (NEW)
**Purpose:** Risk scoring and AI-powered recommendations

#### Features:
- Risk scoring algorithms for payments and projects
- Anomaly detection
- Fraud pattern recognition
- Natural language recommendations

#### Files:
```
backend/services/ai-service/
├── src/
│   ├── risk/
│   │   ├── risk.module.ts
│   │   ├── risk.service.ts
│   │   └── algorithms/
│   │       ├── payment-risk.algorithm.ts
│   │       └── project-risk.algorithm.ts
│   ├── advisory/
│   │   ├── advisory.module.ts
│   │   └── advisory.service.ts
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

### 4.3 Notification Service Completion
**Current State:** Structure exists, needs implementation

#### Features to Complete:
- Email templates for all workflow events
- SMS notifications for mobile users
- Push notifications (optional)
- Notification preferences management
- Delivery status tracking

### 4.4 Integration Service (NEW)
**Purpose:** Connect to external Zambian government systems

#### Planned Integrations:
- ZPPA (Zambia Public Procurement Authority)
- Treasury (Ministry of Finance)
- NRC Verification (National Registration Card)

---

## Phase 5: Testing Strategy

### 5.1 Unit Tests
- API Gateway: Controllers, Services, Guards
- Frontend: Hooks, Components, Utils

### 5.2 Integration Tests
- End-to-end payment workflow
- Project approval chain
- Role-based access control

### 5.3 E2E Tests
- User registration and role assignment
- Complete project lifecycle
- Payment Two-Panel Authorization

---

## Implementation Order

### Week 1: Foundation
1. ✅ Fix backend NPM installation
2. Projects Module (API Gateway)
3. Update useProjects hook with mutations
4. Test project workflow end-to-end

### Week 2: Financial
1. Budgets Module (API Gateway)
2. Update useBudgets hook
3. Complete usePayments hook mutations
4. Test payment Two-Panel workflow

### Week 3: Governance
1. Committees & Meetings Module
2. Create useCommittees hook
3. WDC Sign-off integration
4. Meeting minutes workflow

### Week 4: Documents & Reports
1. Documents Module (API Gateway)
2. Update useDocuments hook
3. Reports Module
4. Document verification system

### Week 5: Microservices
1. Workflow Service
2. Notification Service completion
3. Event-driven architecture

### Week 6: AI & Integration
1. AI Advisory Service
2. Risk scoring implementation
3. External integrations (ZPPA)

### Week 7: Testing & Polish
1. Unit tests
2. Integration tests
3. E2E tests
4. Performance optimization

---

## Module Specifications

### Projects Module Service Implementation

```typescript
// projects.service.ts - Key Methods

interface ProjectsService {
  // CRUD
  findAll(filters: ProjectFilters): Promise<PaginatedResult<Project>>;
  findOne(id: string): Promise<Project>;
  create(dto: CreateProjectDto, user: User): Promise<Project>;
  update(id: string, dto: UpdateProjectDto, user: User): Promise<Project>;

  // Workflow
  submit(id: string, user: User): Promise<Project>;
  cdfcApprove(id: string, dto: ApproveDto, user: User): Promise<Project>;
  tacAppraise(id: string, dto: AppraiseDto, user: User): Promise<Project>;
  plgoApprove(id: string, dto: ApproveDto, user: User): Promise<Project>;
  reject(id: string, dto: RejectDto, user: User): Promise<Project>;
  complete(id: string, user: User): Promise<Project>;

  // Progress
  updateProgress(id: string, progress: number, user: User): Promise<Project>;

  // Validation
  validateStatusTransition(current: ProjectStatus, target: ProjectStatus): boolean;
  validateUserAuthority(user: User, project: Project, action: string): boolean;
}
```

### Budgets Module Service Implementation

```typescript
// budgets.service.ts - Key Methods

interface BudgetsService {
  findAll(fiscalYear?: number): Promise<Budget[]>;
  findByConstituency(constituencyId: string, fiscalYear: number): Promise<Budget>;
  create(dto: CreateBudgetDto, user: User): Promise<Budget>;
  update(id: string, dto: UpdateBudgetDto, user: User): Promise<Budget>;
  approve(id: string, user: User): Promise<Budget>;

  // Analytics
  getUtilization(constituencyId: string): Promise<BudgetUtilization>;
  getAbsorptionRate(constituencyId: string, fiscalYear: number): Promise<number>;
  getProjectAllocationSummary(constituencyId: string): Promise<AllocationSummary>;
}
```

---

## Security Considerations

### Role-Based Access Control (13 Roles)
```
super_admin       - Full system access
ministry_official - National oversight
auditor           - Read-only audit access
plgo              - Provincial oversight
tac_chair         - Technical appraisal lead
tac_member        - Technical appraisal
cdfc_chair        - Constituency committee chair
cdfc_member       - Constituency committee
finance_officer   - Financial operations
wdc_member        - Ward development committee
mp                - Member of Parliament
contractor        - Service provider
citizen           - Public access
```

### Two-Panel Authorization (Payments)
- Panel A: MP, CDFC Chair, Finance Officer (any 1)
- Panel B: PLGO, Ministry Official (any 1)
- Same user cannot approve both panels
- Sequential enforcement (Panel A before Panel B)

### Project Approval Chain
1. WDC endorsement (ward level)
2. CDFC review (constituency level)
3. TAC appraisal (technical review)
4. PLGO approval (provincial level)

---

## Database Tables by Module

### Projects Module
- projects
- wdc_signoffs
- documents

### Payments Module
- payments
- audit_logs

### Budgets Module
- budgets
- expenditure_returns

### Committees Module
- committees
- committee_members
- meetings
- meeting_attendees

### Users Module
- profiles
- user_roles
- user_assignments

### Governance Data
- provinces
- districts
- constituencies
- wards

---

## API Response Format

All API responses follow this structure:

```typescript
// Success Response
{
  success: true,
  data: T,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}

// Error Response
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

---

## Estimated Effort

| Module | Backend | Frontend | Testing | Total |
|--------|---------|----------|---------|-------|
| Projects | 8h | 6h | 4h | 18h |
| Budgets | 6h | 4h | 3h | 13h |
| Committees | 8h | 6h | 4h | 18h |
| Documents | 6h | 4h | 3h | 13h |
| Reports | 8h | 6h | 4h | 18h |
| Workflow Service | 12h | - | 6h | 18h |
| AI Service | 16h | 4h | 6h | 26h |
| Notifications | 8h | 2h | 4h | 14h |
| Integration | 12h | 4h | 6h | 22h |
| **Total** | **84h** | **36h** | **40h** | **160h** |

---

## Success Criteria

1. All API endpoints return correct responses
2. Two-Panel Authorization enforced for payments
3. Project approval chain enforced
4. Role-based access working correctly
5. All frontend pages functional
6. Audit trail complete for all operations
7. Document verification system working
8. 80%+ test coverage

---

## Next Steps

1. **Approve this plan**
2. Start with Phase 1: Fix backend dependencies
3. Implement Projects Module (highest impact)
4. Continue through phases sequentially

---

*Document Version: 1.0*
*Created: January 22, 2026*
*Author: Claude Code*
