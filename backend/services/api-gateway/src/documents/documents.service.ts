import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateDocumentDto, DocumentType } from './dto/create-document.dto';

export interface Document {
  id: string;
  project_id: string | null;
  uploader_id: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  file_hash: string;
  document_type: DocumentType;
  description: string | null;
  is_immutable: boolean;
  immutable_at: string | null;
  immutable_by: string | null;
  constituency_id: string;
  ward_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  project_id?: string;
  constituency_id?: string;
  ward_id?: string;
  document_type?: DocumentType;
  is_immutable?: boolean;
  page?: number;
  limit?: number;
}

export interface VerificationResult {
  verified: boolean;
  document: Document | null;
  project?: {
    id: string;
    name: string;
    project_number: string;
    status: string;
  } | null;
}

@Injectable()
export class DocumentsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Get all documents with optional filters
   */
  async findAll(filters: DocumentFilters = {}): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.constituency_id) {
      query = query.eq('constituency_id', filters.constituency_id);
    }
    if (filters.ward_id) {
      query = query.eq('ward_id', filters.ward_id);
    }
    if (filters.document_type) {
      query = query.eq('document_type', filters.document_type);
    }
    if (filters.is_immutable !== undefined) {
      query = query.eq('is_immutable', filters.is_immutable);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
    }

    return {
      documents: data as Document[],
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Get a single document by ID
   */
  async findOne(id: string): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          project_number,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return data as Document;
  }

  /**
   * Get documents for a project
   */
  async findByProject(projectId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch project documents: ${error.message}`);
    }

    return data as Document[];
  }

  /**
   * Get documents for a constituency
   */
  async findByConstituency(constituencyId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('constituency_id', constituencyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch constituency documents: ${error.message}`);
    }

    return data as Document[];
  }

  /**
   * Create a new document record
   * File upload should be handled separately via Supabase Storage
   */
  async create(dto: CreateDocumentDto, userId: string): Promise<Document> {
    // Validate project exists if project_id is provided
    if (dto.project_id) {
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('id, constituency_id')
        .eq('id', dto.project_id)
        .single();

      if (projectError || !project) {
        throw new NotFoundException(`Project with ID ${dto.project_id} not found`);
      }

      // Ensure constituency_id matches project's constituency
      if (project.constituency_id !== dto.constituency_id) {
        throw new BadRequestException('Document constituency must match project constituency');
      }
    }

    // Check for duplicate file hash (same file already uploaded)
    const { data: existingDoc } = await this.supabase
      .from('documents')
      .select('id')
      .eq('file_hash', dto.file_hash)
      .single();

    if (existingDoc) {
      throw new BadRequestException('A document with this file hash already exists');
    }

    const insertData = {
      project_id: dto.project_id || null,
      file_url: dto.file_url,
      file_name: dto.file_name,
      file_size: dto.file_size || null,
      mime_type: dto.mime_type || null,
      file_hash: dto.file_hash,
      document_type: dto.document_type,
      description: dto.description || null,
      constituency_id: dto.constituency_id,
      ward_id: dto.ward_id || null,
      uploader_id: userId,
      metadata: dto.metadata || null,
      is_immutable: false,
    };

    const { data, error } = await this.supabase
      .from('documents')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create document: ${error.message}`);
    }

    // Log to audit
    await this.logAudit(userId, 'document_created', data.id, null, {
      file_name: dto.file_name,
      document_type: dto.document_type,
    });

    return data as Document;
  }

  /**
   * Delete a document (only non-immutable documents)
   */
  async delete(id: string, userId: string): Promise<void> {
    const document = await this.findOne(id);

    if (document.is_immutable) {
      throw new ForbiddenException('Cannot delete an immutable document');
    }

    // Delete from storage first (extract file path from URL)
    const storageBucket = 'cdf-documents';
    const filePath = document.file_url.split(`/${storageBucket}/`)[1];

    if (filePath) {
      const { error: storageError } = await this.supabase.storage
        .from(storageBucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(`Failed to delete document: ${error.message}`);
    }

    // Log to audit
    await this.logAudit(userId, 'document_deleted', id, null, {
      file_name: document.file_name,
    });
  }

  /**
   * Make a document immutable (cannot be modified or deleted)
   */
  async makeImmutable(id: string, userId: string): Promise<Document> {
    const document = await this.findOne(id);

    if (document.is_immutable) {
      throw new BadRequestException('Document is already immutable');
    }

    const { data, error } = await this.supabase
      .from('documents')
      .update({
        is_immutable: true,
        immutable_at: new Date().toISOString(),
        immutable_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to make document immutable: ${error.message}`);
    }

    // Log to audit
    await this.logAudit(userId, 'document_made_immutable', id, null, {
      file_name: document.file_name,
    });

    return data as Document;
  }

  /**
   * Verify document by file hash (public endpoint for QR verification)
   */
  async verifyByHash(fileHash: string): Promise<VerificationResult> {
    const { data, error } = await this.supabase
      .from('documents')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          project_number,
          status
        )
      `)
      .eq('file_hash', fileHash)
      .single();

    if (error || !data) {
      return {
        verified: false,
        document: null,
        project: null,
      };
    }

    const project = data.projects as {
      id: string;
      name: string;
      project_number: string;
      status: string;
    } | null;

    return {
      verified: true,
      document: {
        ...data,
        projects: undefined,
      } as Document,
      project,
    };
  }

  /**
   * Get document statistics for a constituency
   */
  async getStatistics(constituencyId: string): Promise<{
    total: number;
    by_type: Record<string, number>;
    immutable_count: number;
    total_size: number;
  }> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('document_type, is_immutable, file_size')
      .eq('constituency_id', constituencyId);

    if (error) {
      throw new BadRequestException(`Failed to fetch statistics: ${error.message}`);
    }

    const byType: Record<string, number> = {};
    let immutableCount = 0;
    let totalSize = 0;

    for (const doc of data || []) {
      // Count by type
      byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;

      // Count immutable
      if (doc.is_immutable) {
        immutableCount++;
      }

      // Sum file sizes
      totalSize += doc.file_size || 0;
    }

    return {
      total: data?.length || 0,
      by_type: byType,
      immutable_count: immutableCount,
      total_size: totalSize,
    };
  }

  /**
   * Log audit event
   */
  private async logAudit(
    userId: string,
    action: string,
    resourceId: string,
    decision: string | null,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert([
        {
          user_id: userId,
          action,
          resource_type: 'document',
          resource_id: resourceId,
          decision,
          details,
        },
      ]);
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}
