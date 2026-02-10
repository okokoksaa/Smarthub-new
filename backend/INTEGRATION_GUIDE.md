## Service Integration Guide

This document describes how the CDF Smart Hub microservices communicate and integrate with each other through event-driven architecture and HTTP APIs.

## Overview

The CDF Smart Hub uses two primary integration patterns:

1. **Synchronous HTTP APIs** - For direct service-to-service communication
2. **Asynchronous Events** - For decoupled, event-driven workflows

## Architecture Diagram

```
┌──────────────┐
│  API Gateway │  (Port 3000)
└──────┬───────┘
       │
       ├─────────────────────────────────────────────────┐
       │                  │                 │            │
┌──────▼──────┐  ┌────────▼────────┐  ┌────▼─────┐  ┌──▼───────┐
│    User     │  │     Project     │  │ Finance  │  │ Document │
│   Service   │  │     Service     │  │ Service  │  │ Service  │
└──────┬──────┘  └────────┬────────┘  └────┬─────┘  └──┬───────┘
       │                  │                 │           │
       │         ┌────────▼─────────────────▼───────────▼────┐
       │         │         Event Bus (EventEmitter2)         │
       │         └────────┬─────────────────┬───────────┬────┘
       │                  │                 │           │
       │         ┌────────▼────────┐  ┌────▼─────┐    │
       │         │    Monitoring   │  │  Budget  │    │
       │         │    Services     │  │ Monitor  │    │
       │         └─────────────────┘  └──────────┘    │
       │                                              │
       └──────────────────────────────────────────────┘
                          │
                  ┌───────▼────────┐
                  │  Notification  │
                  │    Service     │
                  └────────────────┘
```

## Event-Driven Integration

### Events Emitted

#### Project Service Events

**project.created**
```typescript
{
  project: {
    id: string,
    name: string,
    createdBy: string,
    constituencyId: string,
    // ... other fields
  }
}
```

**project.cdfc_approved**
```typescript
{
  project: Project,
  approverName: string,
  approvedAt: Date
}
```

**project.tac_approved**
```typescript
{
  project: Project,
  approverName: string,
  approvedAt: Date
}
```

**project.rejected**
```typescript
{
  project: Project,
  rejectedBy: string,
  reason: string
}
```

**milestone.completed**
```typescript
{
  milestone: Milestone,
  project: Project
}
```

**milestone.overdue**
```typescript
{
  milestone: Milestone,
  project: Project,
  daysOverdue: number
}
```

#### Finance Service Events

**payment.created**
```typescript
{
  payment: Payment,
  projectName: string
}
```

**payment.panel_a_approved**
```typescript
{
  payment: Payment,
  projectName: string,
  approverName: string
}
```

**payment.panel_b_approved**
```typescript
{
  payment: Payment,
  projectName: string,
  approverName: string
}
```

**payment.rejected**
```typescript
{
  payment: Payment,
  projectName: string,
  panel: 'Panel A' | 'Panel B',
  rejectedBy: string,
  reason: string
}
```

**payment.executed**
```typescript
{
  payment: Payment,
  projectName: string
}
```

**budget.low**
```typescript
{
  budget: Budget
}
```

**budget.critical**
```typescript
{
  budget: Budget
}
```

**budget.exceeded**
```typescript
{
  budget: Budget
}
```

#### Document Service Events

**document.uploaded**
```typescript
{
  document: Document
}
```

**document.version_uploaded**
```typescript
{
  document: Document,
  previousVersion: Document
}
```

**document.downloaded**
```typescript
{
  document: Document,
  userId: string
}
```

**document.approval_decision**
```typescript
{
  document: Document,
  approved: boolean,
  approverName: string
}
```

**document.deleted**
```typescript
{
  document: Document
}
```

#### Notification Service Events

**notification.sent**
```typescript
{
  notification: Notification
}
```

**notification.failed**
```typescript
{
  notification: Notification,
  error: Error
}
```

**notification.read**
```typescript
{
  notification: Notification
}
```

### Event Listeners

#### Project Events Listener
**Location**: `services/project-service/src/events/project-events.listener.ts`

**Listens to**:
- `project.created` → Notify creator and CDFC members
- `project.cdfc_approved` → Notify creator and TAC members
- `project.tac_approved` → Notify creator (project active)
- `project.rejected` → Notify creator with reason
- `project.updated` → Notify stakeholders
- `milestone.completed` → Notify project creator
- `milestone.overdue` → Notify creator and supervisors

#### Payment Events Listener
**Location**: `services/finance-service/src/events/payment-events.listener.ts`

**Listens to**:
- `payment.created` → Notify creator and Panel A members
- `payment.panel_a_approved` → Notify creator and Panel B members
- `payment.panel_b_approved` → Notify creator (ready for execution)
- `payment.rejected` → Notify creator with reason
- `payment.executed` → Notify creator and stakeholders
- `payment.completed` → Notify creator

#### Document Events Listener
**Location**: `services/document-service/src/events/document-events.listener.ts`

**Listens to**:
- `document.uploaded` → Notify uploader and project stakeholders
- `document.version_uploaded` → Notify uploader
- `document.approval_decision` → Notify uploader
- `document.updated` → Notify uploader
- `document.deleted` → Notify uploader

## HTTP API Integration

### Service URLs

**Environment Variables**:
```bash
USER_SERVICE_URL=http://user-service:3001/api/v1
PROJECT_SERVICE_URL=http://project-service:3002/api/v1
FINANCE_SERVICE_URL=http://finance-service:3003/api/v1
DOCUMENT_SERVICE_URL=http://document-service:3004/api/v1
NOTIFICATION_SERVICE_URL=http://notification-service:3005/api/v1
```

### Common Integration Patterns

#### 1. Get User Information
```typescript
// From any service
const response = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
const user = response.data;
```

#### 2. Get Users by Role
```typescript
const response = await axios.get(`${USER_SERVICE_URL}/users`, {
  params: { role: 'CDFC_MEMBER' }
});
const cdfcMembers = response.data.users;
```

#### 3. Get Users by Constituency
```typescript
const response = await axios.get(`${USER_SERVICE_URL}/users`, {
  params: {
    constituencyId: 'uuid',
    roles: ['MP', 'CDFC_MEMBER']
  }
});
const officials = response.data.users;
```

#### 4. Get Project Details
```typescript
const response = await axios.get(`${PROJECT_SERVICE_URL}/projects/${projectId}`);
const project = response.data;
```

#### 5. Send Notification
```typescript
await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, {
  type: ['EMAIL', 'SMS'],
  category: 'PROJECT_APPROVED',
  priority: 'HIGH',
  recipientId: userId,
  recipientEmail: user.email,
  recipientPhone: user.phone,
  subject: 'Project Approved',
  body: 'Your project has been approved.',
  templateName: 'project-approved',
  templateData: { projectName: project.name }
});
```

## Monitoring Services

### Budget Monitor Service
**Location**: `services/finance-service/src/monitoring/budget-monitor.service.ts`

**Schedule**: Every 6 hours

**Functionality**:
- Monitors all budgets
- Triggers alerts at 20% (LOW) and 10% (CRITICAL) thresholds
- Alerts on budget exceeded
- Notifies MPs, CDFC members, and PS

**Thresholds**:
- LOW: 20% remaining
- CRITICAL: 10% remaining
- EXCEEDED: Negative balance

**Notifications Sent**:
- Email + SMS + Push + In-App for CRITICAL and EXCEEDED
- Email + In-App for LOW

### Milestone Monitor Service
**Location**: `services/project-service/src/monitoring/milestone-monitor.service.ts`

**Schedule**: Daily at 8 AM

**Functionality**:
- Checks for overdue milestones
- Checks for milestones due within 7 days
- Notifies project creators and supervisors

**Notifications Sent**:
- Email + SMS + Push + In-App for overdue
- Email + In-App for upcoming (within 7 days)

## Notification Workflow

### Project Approval Flow

```
1. User creates project
   ↓
2. Event: project.created
   ↓
3. ProjectEventsListener receives event
   ↓
4. Sends notification to:
   - Project creator (confirmation)
   - All CDFC members (approval request)
   ↓
5. CDFC member approves
   ↓
6. Event: project.cdfc_approved
   ↓
7. Sends notification to:
   - Project creator (CDFC approved)
   - All TAC members (approval request)
   ↓
8. TAC member approves
   ↓
9. Event: project.tac_approved
   ↓
10. Sends notification to:
    - Project creator (fully approved, project active)
```

### Payment Approval Flow

```
1. User creates payment
   ↓
2. Event: payment.created
   ↓
3. PaymentEventsListener receives event
   ↓
4. Sends notification to:
   - Payment creator (confirmation)
   - All Panel A members (approval request)
   ↓
5. Panel A member approves
   ↓
6. Event: payment.panel_a_approved
   ↓
7. Sends notification to:
   - Payment creator (Panel A approved)
   - All Panel B members (approval request)
   ↓
8. Panel B member approves
   ↓
9. Event: payment.panel_b_approved
   ↓
10. Sends notification to:
    - Payment creator (fully approved, ready for execution)
    ↓
11. Payment is executed
    ↓
12. Event: payment.executed
    ↓
13. Sends notification to:
    - Payment creator
    - All stakeholders (MPs, PS, CDFC, TAC)
```

## Error Handling

### Event Listener Errors

Event listeners are designed to be **non-blocking**. If a notification fails to send, the error is logged but the system continues to operate.

```typescript
try {
  await this.sendNotification(data);
} catch (error) {
  this.logger.error(`Failed to send notification: ${error.message}`);
  // Don't throw - notifications are non-critical
}
```

### HTTP Integration Errors

Service-to-service HTTP calls should implement retry logic and circuit breakers in production.

```typescript
try {
  const response = await axios.get(url, { timeout: 5000 });
  return response.data;
} catch (error) {
  this.logger.error(`Service call failed: ${error.message}`);
  // Implement retry or fallback logic
  throw error;
}
```

## Testing Integration

### Unit Testing Events

```typescript
describe('ProjectEventsListener', () => {
  it('should send notification when project is created', async () => {
    const event = {
      project: {
        id: 'uuid',
        name: 'Test Project',
        createdBy: 'user-id'
      }
    };

    await listener.handleProjectCreated(event);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications'),
      expect.objectContaining({
        type: ['EMAIL', 'IN_APP'],
        category: 'PROJECT_CREATED'
      })
    );
  });
});
```

### E2E Testing Integration

```typescript
describe('Project Approval Flow (E2E)', () => {
  it('should complete full approval workflow with notifications', async () => {
    // 1. Create project
    const project = await projectService.create(createDto);

    // 2. Verify project.created event was emitted
    expect(eventEmitter.emit).toHaveBeenCalledWith('project.created', {
      project
    });

    // 3. Verify notification was sent to CDFC
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'PROJECT_CREATED'
      })
    );

    // 4. CDFC approves
    await projectService.cdfcApprove(project.id, approvalDto);

    // 5. Verify event and notification
    expect(eventEmitter.emit).toHaveBeenCalledWith('project.cdfc_approved', {
      project: expect.any(Object)
    });

    // ... continue testing full flow
  });
});
```

## Performance Considerations

### Event Emission

Events are processed **asynchronously** and do not block the main request flow.

```typescript
// Emit event (non-blocking)
this.eventEmitter.emit('project.created', { project });

// Return immediately
return project;
```

### Notification Queue

Notifications are queued using Bull/Redis for reliable delivery with retry logic.

```typescript
await this.notificationQueue.add(
  'send-notification',
  { notificationId },
  {
    priority: 1, // URGENT
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
);
```

### HTTP Timeouts

All service-to-service HTTP calls should have timeouts:

```typescript
const response = await axios.get(url, {
  timeout: 5000 // 5 seconds
});
```

## Security

### Service Authentication

Internal service-to-service calls should use service tokens (JWT).

```typescript
const response = await axios.get(url, {
  headers: {
    'Authorization': `Bearer ${serviceToken}`,
    'X-Service-Name': 'project-service'
  }
});
```

### Event Validation

Event payloads should be validated before processing:

```typescript
@OnEvent('project.created')
async handleProjectCreated(payload: any) {
  // Validate payload
  if (!payload.project || !payload.project.id) {
    this.logger.error('Invalid project.created event payload');
    return;
  }

  // Process event
  await this.processProjectCreated(payload);
}
```

## Deployment Considerations

### Service Discovery

In Kubernetes, services are discovered via DNS:
- `user-service.cdf-smarthub.svc.cluster.local`
- `project-service.cdf-smarthub.svc.cluster.local`
- etc.

### Health Checks

All services expose health endpoints for monitoring:
```http
GET /health
```

### Circuit Breakers

Implement circuit breakers for resilient service communication (recommended: Hystrix, resilience4j).

## Best Practices

1. **Event Naming**: Use consistent naming (noun.verb format)
2. **Event Payloads**: Include all necessary data to avoid additional queries
3. **Error Handling**: Always catch and log errors in event listeners
4. **Timeouts**: Set reasonable timeouts for HTTP calls
5. **Retries**: Implement exponential backoff for failed operations
6. **Logging**: Log all service integrations with context
7. **Monitoring**: Track event processing times and failures
8. **Testing**: Test both success and failure scenarios

## Troubleshooting

### Events Not Being Received

1. Check EventEmitter2 is properly configured in app.module.ts
2. Verify event name matches exactly (case-sensitive)
3. Check listener is registered in module providers
4. Review application logs for errors

### Notifications Not Being Sent

1. Check NOTIFICATION_SERVICE_URL environment variable
2. Verify notification service is running and healthy
3. Check notification queue (Redis) is accessible
4. Review notification service logs

### Service-to-Service Communication Failures

1. Verify service URLs are correct
2. Check network connectivity between services
3. Verify DNS resolution in Kubernetes
4. Check service health endpoints
5. Review firewall/security group rules

## Monitoring Dashboards

### Recommended Metrics

- Event emission rate
- Event processing time
- Notification delivery rate
- Service-to-service latency
- Budget alert frequency
- Milestone overdue rate

### Alerting Rules

- Budget exceeded: Immediate alert to ops team
- Payment approval pending > 24h: Alert to supervisors
- Milestone > 7 days overdue: Alert to management
- Notification failure rate > 5%: Alert to ops team
