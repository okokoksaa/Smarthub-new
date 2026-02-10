# Document Service

Document management service for the CDF Smart Hub system with advanced versioning, approval workflows, and MinIO object storage integration.

## Features

### Core Functionality
- **File Upload & Storage**: Secure document upload with MinIO object storage
- **Version Control**: Complete version history with parent-child relationships
- **Document Metadata**: Rich metadata including type, access level, and custom fields
- **File Validation**: Size limits, MIME type validation, and checksum verification
- **Download Management**: Streaming downloads and presigned URL generation
- **Soft Delete**: Safe document deletion with recovery option

### Security Features
- **Access Control Levels**: PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL
- **Hierarchical Permissions**: Integration with administrative hierarchy (Province → District → Constituency → Ward)
- **Checksum Validation**: SHA-256 checksums for file integrity
- **File Type Restrictions**: Only approved MIME types allowed
- **Size Limits**: Maximum 50MB per file

### Approval Workflow
- **Document Status**: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
- **Approval Tracking**: Complete audit trail with approver and timestamp
- **Rejection Handling**: Rejection reasons and notes

### Advanced Features
- **Document Versioning**: Upload new versions while preserving history
- **Search & Filtering**: Full-text search and multi-field filtering
- **Statistics**: Document count, storage usage, type distribution
- **Download Tracking**: Track download count and last download time
- **Event Emissions**: Real-time events for uploads, approvals, downloads

## Architecture

### Technology Stack
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Object Storage**: MinIO (S3-compatible)
- **File Processing**: Multer, Sharp, PDF-lib
- **Events**: EventEmitter2

### Storage Strategy
```
MinIO Bucket Structure:
documents/
├── PROJECT_PROPOSAL/
│   ├── {userId}/
│   │   └── {timestamp}-{random}-{filename}
├── BUDGET_DOCUMENT/
│   ├── {userId}/
│   │   └── {timestamp}-{random}-{filename}
└── ...
```

### Database Schema
```typescript
Document {
  id: UUID
  documentType: DocumentType
  filename: string
  storageKey: string
  mimeType: string
  fileSize: bigint
  checksum: string (SHA-256)
  version: number
  parentDocumentId: UUID (nullable)
  isLatestVersion: boolean
  status: DocumentStatus
  accessLevel: DocumentAccessLevel
  uploadedBy: UUID
  approvedBy: UUID (nullable)
  projectId: UUID (nullable)
  constituencyId: UUID (nullable)
  wardId: UUID (nullable)
  districtId: UUID (nullable)
  provinceId: UUID (nullable)
  tags: string[]
  metadata: JSON
  downloadCount: number
  isDeleted: boolean
  timestamps: createdAt, updatedAt, deletedAt
}
```

## API Endpoints

### Document Upload
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

Body:
- file: File (required)
- documentType: string (required)
- accessLevel: string (optional)
- description: string (optional)
- projectId: UUID (optional)
- constituencyId: UUID (optional)
- wardId: UUID (optional)
- tags: string[] (optional)
- metadata: JSON (optional)

Response: Document
```

### Upload New Version
```http
POST /api/v1/documents/:id/version
Content-Type: multipart/form-data

Body:
- file: File (required)

Response: Document (new version)
```

### List Documents
```http
GET /api/v1/documents?page=1&limit=20&documentType=PROJECT_PROPOSAL&search=health

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- documentType: DocumentType (optional)
- accessLevel: DocumentAccessLevel (optional)
- projectId: UUID (optional)
- constituencyId: UUID (optional)
- wardId: UUID (optional)
- search: string (optional)
- tag: string (optional)

Response: {
  documents: Document[],
  total: number,
  page: number,
  limit: number
}
```

### Get Document
```http
GET /api/v1/documents/:id

Response: Document
```

### Get Document Versions
```http
GET /api/v1/documents/:id/versions

Response: Document[] (ordered by version DESC)
```

### Download Document
```http
GET /api/v1/documents/:id/download

Response: File stream with proper headers
```

### Get Presigned URL
```http
GET /api/v1/documents/:id/presigned-url?expirySeconds=3600

Response: {
  url: string,
  expiresIn: number
}
```

### Update Document Metadata
```http
PUT /api/v1/documents/:id

Body: {
  accessLevel?: DocumentAccessLevel,
  description?: string,
  tags?: string[],
  metadata?: JSON
}

Response: Document
```

### Approve/Reject Document
```http
POST /api/v1/documents/:id/approve

Body: {
  approved: boolean,
  notes?: string
}

Response: Document
```

### Delete Document
```http
DELETE /api/v1/documents/:id

Response: { message: string }
```

### Get Project Documents
```http
GET /api/v1/documents/project/:projectId

Response: Document[]
```

### Get Statistics
```http
GET /api/v1/documents/stats/summary

Response: {
  totalDocuments: number,
  totalSizeGB: number,
  documentsByType: Record<string, number>,
  documentsByAccessLevel: Record<string, number>,
  recentUploads: Document[]
}
```

## Document Types

```typescript
enum DocumentType {
  PROJECT_PROPOSAL = 'PROJECT_PROPOSAL',
  BUDGET_DOCUMENT = 'BUDGET_DOCUMENT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  PAYMENT_VOUCHER = 'PAYMENT_VOUCHER',
  MILESTONE_EVIDENCE = 'MILESTONE_EVIDENCE',
  PROGRESS_REPORT = 'PROGRESS_REPORT',
  COMPLETION_CERTIFICATE = 'COMPLETION_CERTIFICATE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  CORRESPONDENCE = 'CORRESPONDENCE',
  MEETING_MINUTES = 'MEETING_MINUTES',
  LEGAL_DOCUMENT = 'LEGAL_DOCUMENT',
  POLICY_DOCUMENT = 'POLICY_DOCUMENT',
  OTHER = 'OTHER',
}
```

## Access Levels

```typescript
enum DocumentAccessLevel {
  PUBLIC = 'PUBLIC',           // Accessible to everyone
  INTERNAL = 'INTERNAL',       // Accessible to all authenticated users
  RESTRICTED = 'RESTRICTED',   // Requires specific permissions
  CONFIDENTIAL = 'CONFIDENTIAL' // Highly restricted access
}
```

## Allowed File Types

- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`, `image/jpg`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Video: `video/mp4`, `video/mpeg`

Maximum file size: **50MB**

## Environment Variables

```bash
# Server
PORT=3004
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=cdf_smarthub
DB_SSL=false

# MinIO Object Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=cdf-documents

# CORS
CORS_ORIGIN=*
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

## MinIO Setup

### Using Docker
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

### Create Bucket
```bash
# Access MinIO Console at http://localhost:9001
# Login with minioadmin/minioadmin
# Create bucket named "cdf-documents"
```

### Set Bucket Policy (Optional)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::cdf-documents/public/*"]
    }
  ]
}
```

## Events

The Document Service emits the following events:

### document.uploaded
```typescript
{
  document: Document
}
```

### document.version_uploaded
```typescript
{
  document: Document,
  previousVersion: Document
}
```

### document.downloaded
```typescript
{
  document: Document,
  userId: string
}
```

### document.updated
```typescript
{
  document: Document
}
```

### document.approval_decision
```typescript
{
  document: Document,
  approved: boolean
}
```

### document.deleted
```typescript
{
  document: Document
}
```

## Version Control Workflow

### Initial Upload
```typescript
// Version 1 created
{
  id: "uuid-1",
  version: 1,
  parentDocumentId: null,
  isLatestVersion: true
}
```

### Upload New Version
```typescript
// Version 1 updated
{
  id: "uuid-1",
  version: 1,
  parentDocumentId: null,
  isLatestVersion: false  // Changed to false
}

// Version 2 created
{
  id: "uuid-2",
  version: 2,
  parentDocumentId: "uuid-1",
  isLatestVersion: true
}
```

### Get All Versions
```typescript
GET /documents/uuid-2/versions
// Returns: [Version 2, Version 1] (ordered by version DESC)
```

## Integration with Other Services

### API Gateway Integration
The Document Service should be registered in the API Gateway with proper authentication and authorization middleware.

### Project Service Integration
Documents can be linked to projects via the `projectId` field.

### User Service Integration
The `uploadedBy` and `approvedBy` fields reference users from the User Service.

### Notification Service Integration
Listen to document events to send notifications:
- Upload notifications
- Approval request notifications
- Approval decision notifications

## Security Considerations

1. **File Validation**: All uploads are validated for type and size
2. **Checksum Verification**: SHA-256 checksums ensure file integrity
3. **Access Control**: Hierarchical permissions based on administrative structure
4. **Audit Trail**: Complete tracking of uploads, downloads, and approvals
5. **Soft Delete**: Documents are never permanently deleted without explicit action
6. **Presigned URLs**: Time-limited download URLs prevent unauthorized access

## Performance Optimization

1. **Streaming**: Files are streamed rather than loaded into memory
2. **Pagination**: All list endpoints support pagination
3. **Indexing**: Database indexes on frequently queried fields
4. **Caching**: Presigned URLs can be cached for repeated downloads
5. **Event-Driven**: Async operations via event emitters

## Monitoring & Logging

The service logs:
- Document uploads with size
- Version uploads
- Downloads with user tracking
- Approvals and rejections
- Errors and exceptions

## API Documentation

Swagger documentation available at: `http://localhost:3004/api/docs`

## Health Check

```http
GET /health

Response: {
  status: "ok",
  service: "document-service",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## Docker Deployment

```bash
# Build image
docker build -f Dockerfile.document-service -t cdf-smarthub/document-service:latest .

# Run container
docker run -d \
  -p 3004:3004 \
  --name document-service \
  -e DB_HOST=postgres \
  -e MINIO_ENDPOINT=minio \
  cdf-smarthub/document-service:latest
```

## Kubernetes Deployment

See `kubernetes/document-service-deployment.yaml` for production Kubernetes configuration.
