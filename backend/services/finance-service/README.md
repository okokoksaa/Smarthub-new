# Finance Service

Budget allocation and dual-approval payment workflows with zero-tolerance for corruption. This service implements the critical financial controls for CDF Smart Hub.

## Critical Security Features

### Dual-Approval Workflow
- ✅ **Panel A (CDFC - Planning)** approval REQUIRED before Panel B
- ✅ **Panel B (Local Authority - Execution)** approval REQUIRED before payment
- ✅ **Database-level enforcement** - cannot bypass approvals
- ✅ **Complete audit trail** - all approvals logged with user, timestamp
- ✅ **Budget commitment** on submission, **utilization** on payment execution

### Financial Controls
- ✅ Budget validation before payment creation
- ✅ Automatic budget commitment when payment submitted
- ✅ Budget release on rejection or cancellation
- ✅ Budget utilization only after dual approval + payment execution
- ✅ Real-time budget tracking (allocated, committed, utilized, available)
- ✅ Over-budget prevention

## Features

### Budget Management
- ✅ Budget allocation to constituencies and projects
- ✅ Budget approval workflow
- ✅ Budget tracking (allocated, utilized, committed, available)
- ✅ Budget statistics and reporting
- ✅ Multi-category support
- ✅ Fiscal year management

### Payment Workflows
- ✅ Payment voucher creation with full validation
- ✅ Dual-approval workflow (Panel A + Panel B)
- ✅ Budget commitment on submission
- ✅ Budget utilization on payment execution
- ✅ Payment tracking and reporting
- ✅ Supporting documents management
- ✅ Retention percentage handling

## Payment Status Flow

```
DRAFT
  ↓ (submit - commits budget)
PANEL_A_PENDING
  ↓ (Panel A approve)
PANEL_B_PENDING
  ↓ (Panel B approve)
PAYMENT_PENDING
  ↓ (execute payment - utilizes budget)
PAID

(Rejection at any stage → PANEL_A_REJECTED or PANEL_B_REJECTED, releases budget)
(Can be cancelled → CANCELLED, releases budget)
```

## API Endpoints

### Budget Management (8 endpoints)

```
POST   /api/v1/budget              Create budget allocation
GET    /api/v1/budget              List budget allocations (with filters)
GET    /api/v1/budget/statistics   Get budget statistics
GET    /api/v1/budget/:id          Get budget by ID
PATCH  /api/v1/budget/:id          Update budget allocation
POST   /api/v1/budget/:id/approve  Approve budget
POST   /api/v1/budget/:id/allocate Allocate budget (make active)
```

### Payment Management (10 endpoints)

```
POST   /api/v1/payments                      Create payment voucher
GET    /api/v1/payments                      List payment vouchers (with filters)
GET    /api/v1/payments/statistics           Get payment statistics
GET    /api/v1/payments/:id                  Get payment by ID
POST   /api/v1/payments/:id/submit           Submit for approval (commits budget)
POST   /api/v1/payments/:id/panel-a-approve  Panel A (CDFC) approval
POST   /api/v1/payments/:id/panel-b-approve  Panel B (Local Authority) approval
POST   /api/v1/payments/:id/execute          Execute payment (utilizes budget)
POST   /api/v1/payments/:id/cancel           Cancel payment (releases budget)
```

**Total: 18 endpoints**

## Example Requests

### Create Budget Allocation

```bash
curl -X POST http://localhost:3003/api/v1/budget \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fiscalYear": 2024,
    "budgetCategory": "CAPITAL_PROJECTS",
    "constituencyId": "123e4567-e89b-12d3-a456-426614174000",
    "projectId": "123e4567-e89b-12d3-a456-426614174001",
    "allocatedAmount": 1000000,
    "effectiveDate": "2024-01-01",
    "expiryDate": "2024-12-31",
    "description": "FY2024 allocation for health clinic construction"
  }'
```

### Create Payment Voucher

```bash
curl -X POST http://localhost:3003/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentType": "CONTRACTOR_PAYMENT",
    "fiscalYear": 2024,
    "projectId": "123e4567-e89b-12d3-a456-426614174001",
    "budgetAllocationId": "123e4567-e89b-12d3-a456-426614174002",
    "payeeName": "ABC Construction Ltd",
    "payeeAccountNumber": "1234567890",
    "payeeBankName": "Zanaco",
    "payeeBankBranch": "Lusaka Main",
    "amount": 50000,
    "retentionPercentage": 10,
    "paymentMethod": "BANK_TRANSFER",
    "description": "Payment for Phase 1 foundation work",
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-01-15",
    "supportingDocuments": [
      {
        "url": "https://storage.example.com/invoice.pdf",
        "type": "invoice",
        "name": "Invoice #001"
      }
    ]
  }'
```

### Submit Payment (Commits Budget)

```bash
curl -X POST http://localhost:3003/api/v1/payments/{id}/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Panel A Approval (CDFC)

```bash
curl -X POST http://localhost:3003/api/v1/payments/{id}/panel-a-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "approved": true,
    "notes": "Payment verified against project milestones and budget"
  }'
```

### Panel B Approval (Local Authority)

```bash
curl -X POST http://localhost:3003/api/v1/payments/{id}/panel-b-approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "approved": true,
    "notes": "Work completion verified, contractor cleared for payment"
  }'
```

### Execute Payment (Utilizes Budget)

```bash
curl -X POST http://localhost:3003/api/v1/payments/{id}/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentReference": "TXN-2024-001234",
    "paymentReceiptUrl": "https://storage.example.com/receipt.pdf"
  }'
```

## Budget Categories

| Category | Description |
|----------|-------------|
| CAPITAL_PROJECTS | Infrastructure, construction |
| RECURRENT_EXPENSES | Ongoing operational costs |
| EMERGENCY_FUND | Emergency response |
| ADMINISTRATIVE_COSTS | Admin and management |
| MONITORING_EVALUATION | M&E activities |

## Payment Types

| Type | Description |
|------|-------------|
| CONTRACTOR_PAYMENT | Payments to contractors |
| SUPPLIER_PAYMENT | Payments to suppliers |
| SERVICE_PAYMENT | Service provider payments |
| ADVANCE_PAYMENT | Advance payments |
| RETENTION_RELEASE | Retention amount release |
| REFUND | Refunds |
| OTHER | Other payment types |

## Business Rules

### Budget Allocation
- Budget code auto-generated: `BUD-[CONST_CODE]-[YEAR]-[SEQUENCE]`
- Effective date must be before expiry date
- Project-specific allocations validated against project existence
- Cannot have duplicate active allocations for same project

### Budget Approval
- Only SUBMITTED budgets can be approved
- Approval sets status to APPROVED
- Allocation makes budget active (ALLOCATED status)
- Budget updates project's budgetAllocated field

### Payment Creation
- Voucher number auto-generated: `PV-[YEAR]-[SEQUENCE]`
- Validates budget allocation exists
- Validates project exists
- Calculates retention amount and net amount
- Supporting documents timestamped on upload

### Payment Submission
- Requires supporting documents
- **COMMITS budget** (reserves funds)
- Changes status to PANEL_A_PENDING
- Cannot submit if budget insufficient

### Panel A Approval (CDFC)
- Can only approve PANEL_A_PENDING payments
- Approval moves to PANEL_B_PENDING
- Rejection releases budget commitment
- All decisions logged with user + timestamp

### Panel B Approval (Local Authority)
- **CRITICAL**: Can only approve if Panel A already approved
- Can only approve PANEL_B_PENDING payments
- Approval moves to PAYMENT_PENDING
- Rejection releases budget commitment

### Payment Execution
- **CRITICAL**: Requires BOTH Panel A AND Panel B approval
- **UTILIZES budget** (moves from committed to utilized)
- Sets paid = true, payment date, reference
- Updates project amountDisbursed
- Cannot be reversed once executed

### Payment Cancellation
- Cannot cancel paid vouchers
- Releases budget commitment if submitted
- Logs cancellation reason and user

## Data Models

### BudgetAllocation Entity

Key fields:
- budgetCode (unique, auto-generated)
- fiscalYear, budgetCategory
- constituencyId, projectId
- allocatedAmount, amountUtilized, amountCommitted, amountAvailable
- status, approved, approvedBy, approvedAt
- effectiveDate, expiryDate

Computed properties:
- utilizationRate, commitmentRate, isExhausted, isExpired

### PaymentVoucher Entity

Key fields:
- voucherNumber (unique, auto-generated)
- paymentType, fiscalYear
- projectId, budgetAllocationId
- payeeName, payeeAccountNumber, payeeBankName
- amount, retentionPercentage, retentionAmount, netAmount
- paymentMethod, description
- status, panelAApproved, panelBApproved, paid
- panelAApprovedBy, panelAApprovedAt, panelANotes
- panelBApprovedBy, panelBApprovedAt, panelBNotes
- paymentDate, paymentReference, processedBy

Computed properties:
- requiresDualApproval, isFullyApproved, approvalProgress, daysInApprovalProcess

## Event Emissions

### Budget Events
- `budget.created`
- `budget.updated`
- `budget.approved`
- `budget.allocated`
- `budget.utilized`

### Payment Events
- `payment.created`
- `payment.submitted`
- `payment.panel_a_decision`
- `payment.panel_b_decision`
- `payment.executed`
- `payment.cancelled`

## Service Architecture

```
BudgetController
└── BudgetService
    ├── Budget CRUD
    ├── Budget approval
    ├── Budget allocation
    ├── Budget commitment/utilization
    └── Statistics

PaymentsController
└── PaymentsService
    ├── Payment CRUD
    ├── Dual-approval workflow
    ├── Budget integration
    ├── Payment execution
    └── Statistics
    └── BudgetService (dependency)
```

## Security Guarantees

### Database-Level Enforcement
All critical financial controls are enforced at the database level with CHECK constraints and triggers, making it impossible to bypass through application bugs or malicious actors.

### Audit Trail
Every financial action is logged with:
- User ID (who performed the action)
- Timestamp (when it happened)
- Action details (what was done)
- IP address (where it came from)
- Result (success/failure)

### Corruption Prevention
1. **Dual Approval**: No single person can approve a payment
2. **Budget Enforcement**: Cannot spend more than allocated
3. **Immutable Audit Log**: Cannot delete or modify audit records
4. **Role Segregation**: Different roles for approval panels
5. **Real-time Tracking**: All budget movements tracked

## Development

### Start Service

```bash
pnpm run start:dev
```

Service will be available at:
- API: http://localhost:3003/api/v1
- Swagger: http://localhost:3003/api/docs

### Environment Variables

```env
FINANCE_SERVICE_PORT=3003
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_dev_password
DB_DATABASE=cdf_smarthub
```

## Dependencies

- **@nestjs/common** - NestJS core
- **@nestjs/typeorm** - TypeORM integration
- **@nestjs/event-emitter** - Event handling
- **typeorm** - ORM
- **class-validator** - DTO validation

## Integration Points

### Project Service
- Budget allocation to projects
- Payment execution updates project.amountDisbursed

### Audit Service (Future)
- All budget and payment events
- Approval tracking
- Budget utilization tracking

### Notification Service (Future)
- Payment approval notifications
- Budget exhaustion alerts
- Payment execution confirmations

## Production Readiness

### Ready ✅
- [x] Dual-approval workflow
- [x] Budget management
- [x] Payment lifecycle
- [x] Budget commitment/utilization
- [x] Input validation
- [x] Error handling
- [x] Event emissions
- [x] API documentation
- [x] Database entities

### Pending ⏳
- [ ] Automated tests
- [ ] Bank integration
- [ ] Mobile money integration
- [ ] Payment reconciliation
- [ ] Financial reports

## Support

For questions or issues, refer to:
- Main project README: `../../README.md`
- API Documentation: http://localhost:3003/api/docs (when running)
