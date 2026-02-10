# User Service

Complete user management service with RBAC, MFA, email verification, and password management for CDF Smart Hub.

## Features

### User Management
- ✅ Complete CRUD operations with pagination and filtering
- ✅ User creation with email verification
- ✅ User profile updates
- ✅ Soft delete (deactivation)
- ✅ User statistics and reporting

### Authentication & Security
- ✅ Bcrypt password hashing with salt
- ✅ Password strength validation
- ✅ Password change with old password verification
- ✅ Password reset with secure tokens (1-hour expiration)
- ✅ Account lockout after 5 failed login attempts
- ✅ Email verification with tokens

### Multi-Factor Authentication (MFA)
- ✅ TOTP-based MFA using Speakeasy
- ✅ QR code generation for authenticator apps
- ✅ 10 backup codes for account recovery
- ✅ MFA required for financial roles (SYSTEM_ADMIN, FINANCE_OFFICER, PLGO, CDFC_CHAIR)
- ✅ MFA enable/disable with verification
- ✅ Backup code regeneration

### Role-Based Access Control (RBAC)
- ✅ 14 user roles supported
- ✅ Multi-tenant isolation by scope level
- ✅ Hierarchical permissions

## User Roles

| Role | Description | MFA Required |
|------|-------------|--------------|
| SYSTEM_ADMIN | System administrator | Yes |
| MINISTRY | Ministry of Local Government officials | No |
| AUDITOR_GENERAL | Auditor General staff | No |
| PLGO | Provincial Local Government Officer | Yes |
| CDFC_CHAIR | Constituency Development Fund Committee Chair | Yes |
| CDFC_MEMBER | CDFC Member | No |
| WDC_CHAIR | Ward Development Committee Chair | No |
| WDC_MEMBER | WDC Member | No |
| TAC_MEMBER | Technical Advisory Committee Member | No |
| FINANCE_OFFICER | Finance Officer | Yes |
| PROCUREMENT_OFFICER | Procurement Officer | No |
| M_AND_E_OFFICER | Monitoring & Evaluation Officer | No |
| CONTRACTOR | Contractor | No |
| SUPPLIER | Supplier | No |
| CITIZEN | General citizen | No |

## Tenant Scope Levels

- **NATIONAL**: National-level access
- **PROVINCIAL**: Provincial-level access
- **DISTRICT**: District-level access
- **CONSTITUENCY**: Constituency-level access
- **WARD**: Ward-level access

## API Endpoints

### User CRUD

```
POST   /api/v1/users                    Create new user
GET    /api/v1/users                    Get all users (with pagination)
GET    /api/v1/users/statistics         Get user statistics
GET    /api/v1/users/:id                Get user by ID
PATCH  /api/v1/users/:id                Update user
DELETE /api/v1/users/:id                Deactivate user (soft delete)
```

### Email Verification

```
POST   /api/v1/users/verify-email       Verify email with token
POST   /api/v1/users/resend-verification  Resend verification email
```

### Account Management

```
POST   /api/v1/users/:id/lock           Lock user account
POST   /api/v1/users/:id/unlock         Unlock user account
```

### Password Management

```
POST   /api/v1/users/change-password         Change password (requires old password)
POST   /api/v1/users/request-password-reset  Request password reset
POST   /api/v1/users/reset-password          Reset password with token
```

### MFA Management

```
POST   /api/v1/users/mfa/setup                   Setup MFA (returns QR code)
POST   /api/v1/users/mfa/enable                  Enable MFA with verification
POST   /api/v1/users/mfa/disable                 Disable MFA
POST   /api/v1/users/mfa/verify                  Verify MFA token
POST   /api/v1/users/mfa/regenerate-backup-codes Regenerate backup codes
```

## Example Requests

### Create User

```bash
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+260977123456",
    "role": "CDFC_MEMBER",
    "tenantScopeLevel": "CONSTITUENCY"
  }'
```

### Get Users with Pagination

```bash
curl "http://localhost:3001/api/v1/users?page=1&limit=10&role=CDFC_MEMBER&isActive=true&search=john"
```

### Change Password

```bash
curl -X POST http://localhost:3001/api/v1/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "oldPassword": "OldPass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

### Setup MFA

```bash
curl -X POST http://localhost:3001/api/v1/users/mfa/setup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2",
    "..."
  ]
}
```

### Enable MFA

```bash
curl -X POST http://localhost:3001/api/v1/users/mfa/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "verificationCode": "123456",
    "backupCodes": ["A1B2C3D4", "E5F6G7H8", "..."]
  }'
```

## Password Requirements

Passwords must meet the following criteria:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)
- Cannot be a common password (password, password123, 12345678, etc.)

## Security Features

### Password Hashing
- Uses bcrypt with salt rounds = 10
- Passwords stored as hashes in `password_hash` column
- Salts stored separately in `salt` column

### Account Lockout
- Account automatically locked after 5 failed login attempts
- Can be unlocked by administrator
- Failed attempt counter reset on successful login

### Email Verification
- Verification token generated on user creation
- Token sent via email (email service integration pending)
- Users cannot perform certain actions until verified

### Password Reset
- Reset token valid for 1 hour
- One-time use tokens
- Secure random token generation (32 bytes)

### MFA Security
- TOTP-based (Time-based One-Time Password)
- 30-second time window
- Window of 2 time steps (allows for clock skew)
- Backup codes hashed with SHA-256
- Backup codes consumed after single use

## Service Architecture

```
UsersController
├── UsersService          # Core user CRUD operations
├── PasswordService       # Password hashing, validation, reset
└── MfaService           # Multi-factor authentication
```

## Database Schema

The User entity includes:

- **Authentication**: email, passwordHash, salt
- **Personal Info**: firstName, lastName, middleName, nationalIdNumber, dateOfBirth, gender
- **Contact**: phoneNumber, alternativePhone, physicalAddress
- **Role & Permissions**: role, tenantScopeLevel
- **Profile**: profilePhotoUrl, bio
- **MFA**: mfaEnabled, mfaSecret, mfaBackupCodes
- **Email Verification**: isVerified, emailVerifiedAt, verificationToken
- **Password Reset**: passwordResetToken, passwordResetExpires, passwordChangedAt
- **Account Status**: isLocked, lockedAt, lockedReason, failedLoginAttempts
- **Activity**: lastLoginAt, lastLoginIp, lastActivityAt
- **Preferences**: languagePreference, timezone, notificationPreferences

## Development

### Install Dependencies

```bash
pnpm install
```

### Start Service

```bash
# Development mode with hot reload
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

# Watch mode
pnpm test:watch
```

### Build

```bash
pnpm run build
```

## Environment Variables

```env
# Service Configuration
USER_SERVICE_PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_dev_password
DB_DATABASE=cdf_smarthub

# JWT (for token validation)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h
```

## Dependencies

### Core Dependencies
- **@nestjs/common** - NestJS core
- **@nestjs/typeorm** - TypeORM integration
- **typeorm** - ORM for database operations
- **bcrypt** - Password hashing
- **speakeasy** - TOTP generation
- **qrcode** - QR code generation for MFA
- **class-validator** - DTO validation
- **class-transformer** - DTO transformation

## Integration Points

### Email Service (Pending)
- Email verification emails
- Password reset emails
- Account status notification emails

### Audit Service (Future)
- Log all user management operations
- Track password changes
- Monitor failed login attempts

### Notification Service (Future)
- In-app notifications
- SMS notifications for security events
- Push notifications

## Security Best Practices

1. **Never log sensitive data** - Passwords, tokens, and secrets are never logged
2. **Use select: false** - Sensitive fields excluded from default queries
3. **Validate all input** - DTOs with class-validator decorators
4. **Rate limiting** - Should be implemented at API Gateway level
5. **HTTPS only** - Use SSL/TLS in production
6. **Secure token storage** - Tokens stored hashed when possible

## TODO

- [ ] Integrate email service for verification and reset emails
- [ ] Add user avatar upload functionality
- [ ] Implement user session management
- [ ] Add user activity logging
- [ ] Integrate with audit service
- [ ] Add user export functionality
- [ ] Implement user import from CSV
- [ ] Add user role change history
- [ ] Implement user delegation/impersonation
- [ ] Add user groups/teams functionality

## Support

For questions or issues, refer to:
- Main project README: `../../README.md`
- Getting Started Guide: `../../GETTING_STARTED.md`
- API Documentation: http://localhost:3001/api/docs (when running)
