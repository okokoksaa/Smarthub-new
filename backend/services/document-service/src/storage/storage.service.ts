import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';
import * as crypto from 'crypto';

/**
 * Storage Service
 * Handles file storage operations using MinIO (S3-compatible)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: MinioClient;
  private readonly bucketName: string;

  constructor() {
    this.minioClient = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
      secretKey: process.env.MINIO_SECRET_KEY || 'minio123',
    });

    this.bucketName = process.env.MINIO_BUCKET || 'cdf-documents';
    this.initializeBucket();
  }

  /**
   * Initialize MinIO bucket
   */
  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);

      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket created: ${this.bucketName}`);

        // Set bucket policy to allow authenticated reads
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
      } else {
        this.logger.log(`Bucket already exists: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket: ${error.message}`);
      throw new InternalServerErrorException('Failed to initialize storage');
    }
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    storageKey: string,
    metadata?: Record<string, string>,
  ): Promise<{ etag: string; versionId: string }> {
    try {
      const metaData = {
        'Content-Type': file.mimetype,
        'Original-Filename': file.originalname,
        ...metadata,
      };

      const result = await this.minioClient.putObject(
        this.bucketName,
        storageKey,
        file.buffer,
        file.size,
        metaData,
      );

      this.logger.log(`File uploaded: ${storageKey} (${file.size} bytes)`);

      return {
        etag: result.etag,
        versionId: result.versionId || '',
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Download file from MinIO
   */
  async downloadFile(storageKey: string): Promise<Readable> {
    try {
      const stream = await this.minioClient.getObject(this.bucketName, storageKey);
      this.logger.log(`File downloaded: ${storageKey}`);
      return stream;
    } catch (error) {
      this.logger.error(`Download failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(storageKey: string): Promise<{
    size: number;
    etag: string;
    lastModified: Date;
    metaData: Record<string, string>;
  }> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, storageKey);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata: ${error.message}`);
      throw new InternalServerErrorException('Failed to get file metadata');
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, storageKey);
      this.logger.log(`File deleted: ${storageKey}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Generate presigned URL for direct download
   */
  async getPresignedUrl(
    storageKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        storageKey,
        expirySeconds,
      );
      this.logger.log(`Presigned URL generated: ${storageKey}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Generate presigned URL for direct upload
   */
  async getPresignedUploadUrl(
    storageKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedPutObject(
        this.bucketName,
        storageKey,
        expirySeconds,
      );
      this.logger.log(`Presigned upload URL generated: ${storageKey}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned upload URL: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Calculate file checksum (SHA-256)
   */
  calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate unique storage key
   */
  generateStorageKey(
    userId: string,
    originalFilename: string,
    documentType: string,
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalFilename.split('.').pop();
    const sanitizedFilename = originalFilename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    return `documents/${documentType}/${userId}/${timestamp}-${randomString}-${sanitizedFilename}`;
  }

  /**
   * Copy file to new location (for versioning)
   */
  async copyFile(sourceKey: string, destKey: string): Promise<void> {
    try {
      await this.minioClient.copyObject(
        this.bucketName,
        destKey,
        `/${this.bucketName}/${sourceKey}`,
      );
      this.logger.log(`File copied: ${sourceKey} -> ${destKey}`);
    } catch (error) {
      this.logger.error(`Copy failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to copy file');
    }
  }

  /**
   * List files with prefix
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
      const files: string[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });

        stream.on('end', () => {
          resolve(files);
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`List files failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to list files');
    }
  }
}
