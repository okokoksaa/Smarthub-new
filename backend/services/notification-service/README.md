## Notification Service

Multi-channel notification service for the CDF Smart Hub system supporting Email, SMS, Push, and In-App notifications with queue-based processing and retry mechanisms.

## Features

### Core Functionality
- **Multi-Channel Notifications**: EMAIL, SMS, PUSH, IN_APP
- **Priority Levels**: LOW, NORMAL, HIGH, URGENT
- **Status Tracking**: PENDING, SENDING, SENT, DELIVERED, READ, FAILED
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Queue Processing**: Bull queue with Redis for reliable delivery
- **Template System**: Handlebars templates for email notifications
- **Scheduled Sending**: Schedule notifications for future delivery
- **Expiration**: Set expiration times for time-sensitive notifications

### Notification Categories
- Project notifications (created, updated, approved, rejected)
- Milestone notifications (created, completed, overdue)
- Payment notifications (created, approvals, executed)
- Document notifications (uploaded, approved, rejected)
- Budget notifications (allocated, low, exceeded)
- User notifications (created, role changed, password reset, MFA)
- System alerts and maintenance

### Channel Support

#### Email (SMTP)
- HTML and plain text support
- Handlebars templates
- Attachments support
- Template rendering and caching

#### SMS (Twilio)
- International phone number support
- E.164 format handling
- Message status tracking
- 160 character automatic splitting

#### Push Notifications (Firebase)
- Android and iOS support
- Topic-based messaging
- Data payloads
- Click actions
- Badge management

#### In-App Notifications
- Real-time notification feed
- Read/unread tracking
- Notification history

## Architecture

### Technology Stack
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Queue**: Bull (Redis-based)
- **Email**: Nodemailer
- **SMS**: Twilio
- **Push**: Firebase Cloud Messaging (FCM)
- **Templates**: Handlebars

### Queue Processing
```
User Request → Create Notification → Queue Job → Process with Priority
                                         ↓
                    Success ←  Send via Channel  → Retry (if failed)
                                         ↓
                              Update Status in DB
```

### Priority Queue
- URGENT: Priority 1
- HIGH: Priority 2
- NORMAL: Priority 3 (default)
- LOW: Priority 4

## API Endpoints

### Create Notification
```http
POST /api/v1/notifications

Body: {
  type: "EMAIL" | "SMS" | "PUSH" | "IN_APP" | ["EMAIL", "SMS"],
  category: "PROJECT_APPROVED",
  priority: "NORMAL",
  recipientId: "uuid",
  recipientEmail: "user@example.com",
  recipientPhone: "+260977123456",
  deviceToken: "firebase-token",
  subject: "Project Approved",
  body: "Your project has been approved.",
  htmlBody: "<p>Your project has been <strong>approved</strong>.</p>",
  templateName: "project-approved",
  templateData: { projectName: "Health Clinic" },
  projectId: "uuid",
  scheduledFor: "2024-12-31T23:59:59Z",
  expiresAt: "2025-01-31T23:59:59Z"
}

Response: Notification[]
```

### Get User Notifications
```http
GET /api/v1/notifications?page=1&limit=20&unreadOnly=true

Query Parameters:
- type: NotificationType (optional)
- category: NotificationCategory (optional)
- status: NotificationStatus (optional)
- unreadOnly: boolean (optional)
- page: number (default: 1)
- limit: number (default: 20)

Response: {
  notifications: Notification[],
  total: number,
  unreadCount: number
}
```

### Get Unread Count
```http
GET /api/v1/notifications/unread-count

Response: { count: number }
```

### Get Statistics
```http
GET /api/v1/notifications/statistics

Response: {
  total: number,
  byType: Record<string, number>,
  byStatus: Record<string, number>,
  byCategory: Record<string, number>,
  successRate: number
}
```

### Mark as Read
```http
PATCH /api/v1/notifications/:id/read

Response: Notification
```

### Mark All as Read
```http
PATCH /api/v1/notifications/mark-all-read

Response: { updated: number }
```

### Retry Failed Notification
```http
POST /api/v1/notifications/:id/retry

Response: { message: "Notification queued for retry" }
```

### Delete Notification
```http
DELETE /api/v1/notifications/:id

Response: { message: "Notification deleted successfully" }
```

## Notification Types

### EMAIL
Requires: `recipientEmail`

Features:
- HTML and plain text
- Templates with Handlebars
- Attachments
- Embedded images

### SMS
Requires: `recipientPhone`

Features:
- International format support
- Automatic E.164 formatting
- Message status tracking
- Twilio integration

### PUSH
Requires: `deviceToken`

Features:
- Android and iOS support
- Rich notifications
- Data payloads
- Click actions
- Topic subscriptions

### IN_APP
Requires: `recipientId`

Features:
- Real-time feed
- Read/unread status
- Notification history
- User preferences

## Environment Variables

```bash
# Server
PORT=3005
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=cdf_smarthub

# Redis (Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMTP (Email)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@cdf.gov.zm
SMTP_PASS=your_smtp_password
SMTP_FROM="CDF Smart Hub <noreply@cdf.gov.zm>"

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+260123456789

# Firebase (Push)
FIREBASE_PROJECT_ID=cdf-smarthub
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json

# Frontend
FRONTEND_URL=https://cdf-smarthub.gov.zm

# CORS
CORS_ORIGIN=*
```

## Email Templates

Templates are located in `templates/email/` and use Handlebars syntax.

### Available Templates

#### welcome.hbs
Variables: `userName`

#### password-reset.hbs
Variables: `userName`, `resetLink`, `resetToken`

#### project-approved.hbs
Variables: `projectName`, `approverName`

#### payment-approval.hbs
Variables: `paymentAmount`, `projectName`, `panel`

#### payment-executed.hbs
Variables: `paymentAmount`, `projectName`

### Creating Custom Templates

```handlebars
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{subject}}</title>
</head>
<body>
    <h2>Hello {{userName}},</h2>
    <p>{{message}}</p>
</body>
</html>
```

## Queue Configuration

### Job Options
```typescript
{
  priority: 1-4,           // Based on notification priority
  delay: 0,                // Milliseconds to delay
  attempts: 3,             // Max retry attempts
  backoff: {
    type: 'exponential',   // Exponential backoff
    delay: 5000            // Start at 5 seconds
  },
  removeOnComplete: true,  // Clean up completed jobs
  removeOnFail: false      // Keep failed jobs for inspection
}
```

### Retry Strategy
```
Attempt 1: Immediate
Attempt 2: 5 seconds later
Attempt 3: 10 seconds later
Attempt 4: 20 seconds later
```

## Development

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm run dev
```

### Build
```bash
pnpm run build
```

### Run Production
```bash
pnpm run start:prod
```

## Twilio Setup

### Sign Up
1. Create account at https://www.twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number

### Configure
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+260123456789
```

## Firebase Setup

### Create Project
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Cloud Messaging

### Get Service Account
1. Project Settings → Service Accounts
2. Generate New Private Key
3. Save JSON file

### Configure
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

## SMTP Setup

### Gmail (Development)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

### SendGrid (Production)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Amazon SES (Production)
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## Events

The Notification Service emits the following events:

### notification.sent
```typescript
{
  notification: Notification
}
```

### notification.failed
```typescript
{
  notification: Notification,
  error: Error
}
```

### notification.read
```typescript
{
  notification: Notification
}
```

## Integration Examples

### Send Welcome Email
```typescript
await notificationsService.createNotification({
  type: NotificationType.EMAIL,
  category: NotificationCategory.USER_CREATED,
  recipientId: user.id,
  recipientEmail: user.email,
  subject: 'Welcome to CDF Smart Hub',
  body: 'Welcome!',
  templateName: 'welcome',
  templateData: { userName: user.fullName },
});
```

### Send Payment Approval (Multi-Channel)
```typescript
await notificationsService.createNotification({
  type: [NotificationType.EMAIL, NotificationType.SMS, NotificationType.PUSH],
  category: NotificationCategory.PAYMENT_PANEL_A_APPROVAL,
  priority: NotificationPriority.HIGH,
  recipientId: approver.id,
  recipientEmail: approver.email,
  recipientPhone: approver.phone,
  deviceToken: approver.deviceToken,
  subject: 'Payment Approval Required',
  body: `Payment approval required for project "${project.name}"`,
  templateName: 'payment-approval',
  templateData: {
    projectName: project.name,
    paymentAmount: payment.amount,
    panel: 'Panel A (CDFC)',
  },
  paymentId: payment.id,
  projectId: project.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});
```

### Schedule System Maintenance Alert
```typescript
const maintenanceDate = new Date('2024-12-31T02:00:00Z');

await notificationsService.createNotification({
  type: [NotificationType.EMAIL, NotificationType.IN_APP],
  category: NotificationCategory.SYSTEM_MAINTENANCE,
  priority: NotificationPriority.URGENT,
  recipientId: user.id,
  recipientEmail: user.email,
  subject: 'Scheduled System Maintenance',
  body: 'System will be down for maintenance on Dec 31 at 2:00 AM UTC',
  scheduledFor: new Date(maintenanceDate.getTime() - 24 * 60 * 60 * 1000), // 24h before
});
```

## Monitoring

### Queue Dashboard
Bull Board can be added for visual queue monitoring:
```bash
npm install @bull-board/express
```

### Metrics
- Total notifications sent
- Success rate by channel
- Average delivery time
- Failed notification rate
- Retry success rate

### Logging
All operations are logged with context:
- Notification creation
- Queue processing
- Send attempts
- Failures and retries

## Security Considerations

1. **API Authentication**: All endpoints require JWT authentication
2. **User Isolation**: Users can only access their own notifications
3. **Rate Limiting**: Prevent notification spam
4. **Template Validation**: Prevent XSS in email templates
5. **Phone Validation**: E.164 format enforcement
6. **Secrets Management**: Use Kubernetes secrets for credentials

## Performance Optimization

1. **Queue-Based Processing**: Async notification sending
2. **Template Caching**: Compiled templates cached in memory
3. **Connection Pooling**: SMTP connection reuse
4. **Batch Operations**: Mark multiple as read in single query
5. **Indexing**: Database indexes on recipient, status, category

## Health Check

```http
GET /health

Response: {
  status: "ok",
  service: "notification-service",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## Docker Deployment

```bash
# Build image
docker build -f Dockerfile.notification-service -t cdf-smarthub/notification-service:latest .

# Run container
docker run -d \
  -p 3005:3005 \
  --name notification-service \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  cdf-smarthub/notification-service:latest
```

## Kubernetes Deployment

See `kubernetes/notification-service-deployment.yaml` for production Kubernetes configuration.

## API Documentation

Swagger documentation available at: `http://localhost:3005/api/docs`
