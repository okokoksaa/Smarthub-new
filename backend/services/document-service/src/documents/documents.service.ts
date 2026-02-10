import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentAccessLevel,
} from '@shared/database';
import { StorageService } from '../storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ApproveDocumentDto } from './dto/approve-document.dto';

/**
 * Documents Service
 * Handles document management with versioning and approval workflow
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Upload and create document
   */
  async upload(
    file: Express.Multer.File,
    createDto: CreateDocumentDto,
    userId: string,
  ): Promise<Document> {
    // Validate file
    this.validateFile(file);

    // Generate storage key
    const storageKey = this.storageService.generateStorageKey(
      userId,
      file.originalname,
      createDto.documentType,
    );

    // Calculate checksum
    const checksum = this.storageService.calculateChecksum(file.buffer);

    // Upload to storage
    const uploadResult = await this.storageService.uploadFile(file, storageKey, {
      documentType: createDto.documentType,
      uploadedBy: userId,
    });

    // Create document record
    const document = this.documentRepository.create({
      ...createDto,
      filename: file.originalname,
      originalFilename: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedBy: userId,
      status: DocumentStatus.DRAFT,
      version: 1,
      isLatestVersion: true,
      metadata: {
        ...createDto.metadata,
        etag: uploadResult.etag,
        versionId: uploadResult.versionId,
      },
    });

    const savedDocument = await this.documentRepository.save(document);

    this.logger.log(
      `Document uploaded: ${savedDocument.id} (${savedDocument.fileSizeMB} MB)`,
    );

    // Emit event
    this.eventEmitter.emit('document.uploaded', { document: savedDocument });

    return savedDocument;
  }

  /**
   * Upload new version of existing document
   */
  async uploadVersion(
    documentId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Document> {
    const existingDocument = await this.findOne(documentId);

    // Validate file
    this.validateFile(file);

    // Generate storage key for new version
    const storageKey = this.storageService.generateStorageKey(
      userId,
      file.originalname,
      existingDocument.documentType,
    );

    // Calculate checksum
    const checksum = this.storageService.calculateChecksum(file.buffer);

    // Upload to storage
    const uploadResult = await this.storageService.uploadFile(file, storageKey, {
      documentType: existingDocument.documentType,
      uploadedBy: userId,
      parentDocumentId: existingDocument.id,
      version: String(existingDocument.version + 1),
    });

    // Mark existing document as not latest
    existingDocument.isLatestVersion = false;
    await this.documentRepository.save(existingDocument);

    // Create new version
    const newVersion = this.documentRepository.create({
      ...existingDocument,
      id: undefined,
      filename: file.originalname,
      originalFilename: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedBy: userId,
      parentDocumentId: existingDocument.id,
      version: existingDocument.version + 1,
      isLatestVersion: true,
      status: DocumentStatus.DRAFT,
      approvedBy: null,
      approvedAt: null,
      approvalNotes: null,
      metadata: {
        ...existingDocument.metadata,
        etag: uploadResult.etag,
        versionId: uploadResult.versionId,
      },
    });

    const savedVersion = await this.documentRepository.save(newVersion);

    this.logger.log(
      `New version uploaded: ${savedVersion.id} (version ${savedVersion.version})`,
    );

    // Emit event
    this.eventEmitter.emit('document.version_uploaded', {
      document: savedVersion,
      previousVersion: existingDocument,
    });

    return savedVersion;
  }

  /**
   * Download document
   */
  async download(documentId: string, userId: string): Promise<{
    stream: NodeJS.ReadableStream;
    filename: string;
    mimeType: string;
  }> {
    const document = await this.findOne(documentId);

    // Check access permission
    await this.checkAccessPermission(document, userId);

    // Get file stream from storage
    const stream = await this.storageService.downloadFile(document.storageKey);

    // Update download count
    document.downloadCount += 1;
    document.lastDownloadedAt = new Date();
    await this.documentRepository.save(document);

    this.logger.log(`Document downloaded: ${documentId} by user ${userId}`);

    // Emit event
    this.eventEmitter.emit('document.downloaded', { document, userId });

    return {
      stream,
      filename: document.originalFilename,
      mimeType: document.mimeType,
    };
  }

  /**
   * Get presigned download URL
   */
  async getDownloadUrl(
    documentId: string,
    userId: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    const document = await this.findOne(documentId);

    // Check access permission
    await this.checkAccessPermission(document, userId);

    const url = await this.storageService.getPresignedUrl(
      document.storageKey,
      expirySeconds,
    );

    this.logger.log(`Download URL generated: ${documentId}`);

    return url;
  }

  /**
   * Find all documents with query filters
   */
  async findAll(queryDto: any, userId: string): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto?.page || 1;
    const limit = Math.min(queryDto?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.uploader', 'uploader')
      .leftJoinAndSelect('document.approver', 'approver')
      .leftJoinAndSelect('document.project', 'project')
      .where('document.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('document.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (queryDto?.documentType) {
      queryBuilder.andWhere('document.documentType = :documentType', {
        documentType: queryDto.documentType,
      });
    }

    if (queryDto?.accessLevel) {
      queryBuilder.andWhere('document.accessLevel = :accessLevel', {
        accessLevel: queryDto.accessLevel,
      });
    }

    if (queryDto?.projectId) {
      queryBuilder.andWhere('document.projectId = :projectId', {
        projectId: queryDto.projectId,
      });
    }

    if (queryDto?.constituencyId) {
      queryBuilder.andWhere('document.constituencyId = :constituencyId', {
        constituencyId: queryDto.constituencyId,
      });
    }

    if (queryDto?.wardId) {
      queryBuilder.andWhere('document.wardId = :wardId', {
        wardId: queryDto.wardId,
      });
    }

    if (queryDto?.districtId) {
      queryBuilder.andWhere('document.districtId = :districtId', {
        districtId: queryDto.districtId,
      });
    }

    if (queryDto?.provinceId) {
      queryBuilder.andWhere('document.provinceId = :provinceId', {
        provinceId: queryDto.provinceId,
      });
    }

    if (queryDto?.search) {
      queryBuilder.andWhere(
        '(document.filename ILIKE :search OR document.description ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto?.tag) {
      queryBuilder.andWhere(':tag = ANY(document.tags)', { tag: queryDto.tag });
    }

    // Only show latest versions by default
    queryBuilder.andWhere('document.isLatestVersion = :isLatestVersion', {
      isLatestVersion: true,
    });

    const [documents, total] = await queryBuilder.getManyAndCount();

    return {
      documents,
      total,
      page,
      limit,
    };
  }

  /**
   * Find document by ID
   */
  async findOne(id: string, userId?: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['uploader', 'approver', 'project', 'versions'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  /**
   * Get document versions
   */
  async getVersions(documentId: string): Promise<Document[]> {
    const document = await this.findOne(documentId);

    // Get root document (original)
    const rootDocumentId = document.parentDocumentId || document.id;

    // Get all versions
    const versions = await this.documentRepository.find({
      where: [
        { id: rootDocumentId },
        { parentDocumentId: rootDocumentId },
      ],
      order: { version: 'DESC' },
      relations: ['uploader'],
    });

    return versions;
  }

  /**
   * Update document metadata
   */
  async update(
    id: string,
    updateDto: UpdateDocumentDto,
    userId: string,
  ): Promise<Document> {
    const document = await this.findOne(id);

    // Only uploader or admin can update
    if (document.uploadedBy !== userId) {
      throw new ForbiddenException('Only the uploader can update document metadata');
    }

    Object.assign(document, updateDto);
    const updatedDocument = await this.documentRepository.save(document);

    this.logger.log(`Document updated: ${id}`);

    // Emit event
    this.eventEmitter.emit('document.updated', { document: updatedDocument });

    return updatedDocument;
  }

  /**
   * Approve document
   */
  async approve(
    id: string,
    approvalDto: ApproveDocumentDto,
    userId: string,
  ): Promise<Document> {
    const document = await this.findOne(id);

    if (document.status !== DocumentStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only documents pending review can be approved');
    }

    document.status = approvalDto.approved
      ? DocumentStatus.APPROVED
      : DocumentStatus.REJECTED;
    document.approvedBy = userId;
    document.approvedAt = new Date();
    document.approvalNotes = approvalDto.notes;

    if (!approvalDto.approved) {
      document.rejectedBy = userId;
      document.rejectedAt = new Date();
      document.rejectionReason = approvalDto.notes;
    }

    const updatedDocument = await this.documentRepository.save(document);

    this.logger.log(
      `Document ${approvalDto.approved ? 'approved' : 'rejected'}: ${id}`,
    );

    // Emit event
    this.eventEmitter.emit('document.approval_decision', {
      document: updatedDocument,
      approved: approvalDto.approved,
    });

    return updatedDocument;
  }

  /**
   * Soft delete document
   */
  async remove(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id);

    // Only uploader or admin can delete
    if (document.uploadedBy !== userId) {
      throw new ForbiddenException('Only the uploader can delete the document');
    }

    // Prevent deletion if immutable flag is set in metadata
    if ((document.metadata as any)?.is_immutable) {
      throw new BadRequestException('Cannot delete an immutable document');
    }

    document.isDeleted = true;
    document.deletedAt = new Date();
    document.deletedBy = userId;

    await this.documentRepository.save(document);

    this.logger.log(`Document soft deleted: ${id}`);

    // Emit event
    this.eventEmitter.emit('document.deleted', { document });
  }

  /**
   * Permanently delete document and file
   */
  async permanentDelete(id: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Delete file from storage
    await this.storageService.deleteFile(document.storageKey);

    // Delete database record
    await this.documentRepository.remove(document);

    this.logger.log(`Document permanently deleted: ${id}`);
  }

  /**
   * Get presigned URL for document
   */
  async getPresignedUrl(
    documentId: string,
    userId: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    return this.getDownloadUrl(documentId, userId, expirySeconds);
  }

  /**
   * Get all documents for a project
   */
  async getProjectDocuments(projectId: string, userId: string): Promise<Document[]> {
    const documents = await this.documentRepository.find({
      where: {
        projectId,
        isDeleted: false,
        isLatestVersion: true,
      },
      relations: ['uploader', 'approver'],
      order: { createdAt: 'DESC' },
    });

    return documents;
  }

  /**
   * Verify document by checksum (file hash)
   */
  async verifyByHash(fileHash: string): Promise<{
    verified: boolean;
    document: Document | null;
  }> {
    const doc = await this.documentRepository.findOne({
      where: { checksum: fileHash, isDeleted: false },
      relations: ['project'],
    });

    if (!doc) {
      return { verified: false, document: null };
    }

    return { verified: true, document: doc };
  }

  /**
   * Find documents by constituency
   */
  async findByConstituency(constituencyId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { constituencyId, isDeleted: false, isLatestVersion: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mark a document as immutable (stored in metadata)
   */
  async makeImmutable(id: string, userId: string): Promise<Document> {
    const doc = await this.findOne(id);

    const metadata = { ...(doc.metadata || {}), is_immutable: true, immutable_by: userId, immutable_at: new Date().toISOString() };
    doc.metadata = metadata;

    const saved = await this.documentRepository.save(doc);
    return saved;
  }

  /**
   * Statistics by constituency (count by type, immutable count approximation)
   */
  async getStatisticsByConstituency(constituencyId: string): Promise<{
    total: number;
    by_type: Record<string, number>;
    immutable_count: number;
    total_size: number;
  }> {
    const docs = await this.documentRepository.find({
      where: { constituencyId, isDeleted: false, isLatestVersion: true },
    });

    const byType: Record<string, number> = {};
    let immutableCount = 0;
    let totalSize = 0;

    for (const d of docs) {
      byType[d.documentType] = (byType[d.documentType] || 0) + 1;
      if ((d.metadata as any)?.is_immutable) immutableCount += 1;
      totalSize += Number(d.fileSize) || 0;
    }

    return {
      total: docs.length,
      by_type: byType,
      immutable_count: immutableCount,
      total_size: totalSize,
    };
  }

  /**
   * Get document statistics
   */
  async getStatistics(userId: string): Promise<{
    totalDocuments: number;
    totalSizeGB: number;
    documentsByType: Record<string, number>;
    documentsByAccessLevel: Record<string, number>;
    recentUploads: Document[];
  }> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.isDeleted = :isDeleted', { isDeleted: false });

    const documents = await queryBuilder.getMany();

    const totalDocuments = documents.length;
    const totalSizeBytes = documents.reduce((sum, doc) => sum + Number(doc.fileSize), 0);
    const totalSizeGB = Number((totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2));

    // By type
    const documentsByType: Record<string, number> = {};
    documents.forEach((doc) => {
      documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
    });

    // By access level
    const documentsByAccessLevel: Record<string, number> = {};
    documents.forEach((doc) => {
      documentsByAccessLevel[doc.accessLevel] = (documentsByAccessLevel[doc.accessLevel] || 0) + 1;
    });

    // Recent uploads (last 10)
    const recentUploads = await this.documentRepository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['uploader'],
    });

    return {
      totalDocuments,
      totalSizeGB,
      documentsByType,
      documentsByAccessLevel,
      recentUploads,
    };
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4',
      'video/mpeg',
    ];

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Check if user has access to document
   */
  private async checkAccessPermission(
    document: Document,
    userId: string,
  ): Promise<void> {
    // Document owner always has access
    if (document.uploadedBy === userId) {
      return;
    }

    // PUBLIC documents are accessible to everyone
    if (document.accessLevel === DocumentAccessLevel.PUBLIC) {
      return;
    }

    // For other access levels, implement role-based or hierarchy-based checks
    // This would integrate with the hierarchical access control system

    // For now, allow access to INTERNAL documents
    if (document.accessLevel === DocumentAccessLevel.INTERNAL) {
      return;
    }

    // RESTRICTED and CONFIDENTIAL documents require specific permissions
    throw new ForbiddenException('You do not have permission to access this document');
  }
}
