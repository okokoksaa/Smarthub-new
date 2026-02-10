import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DocumentsService, DocumentFilters } from './documents.service';
import { CreateDocumentDto, DocumentType } from './dto/create-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Get all documents with optional filters
   * GET /api/v1/documents
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query('project_id') projectId?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('ward_id') wardId?: string,
    @Query('document_type') documentType?: DocumentType,
    @Query('is_immutable') isImmutable?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: DocumentFilters = {
      project_id: projectId,
      constituency_id: constituencyId,
      ward_id: wardId,
      document_type: documentType,
      is_immutable: isImmutable ? isImmutable === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const result = await this.documentsService.findAll(filters);

    return {
      success: true,
      data: result.documents,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get a single document by ID
   * GET /api/v1/documents/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const document = await this.documentsService.findOne(id);

    return {
      success: true,
      data: document,
    };
  }

  /**
   * Get documents for a specific project
   * GET /api/v1/documents/project/:projectId
   */
  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const documents = await this.documentsService.findByProject(projectId);

    return {
      success: true,
      data: documents,
    };
  }

  /**
   * Get documents for a specific constituency
   * GET /api/v1/documents/constituency/:constituencyId
   */
  @Get('constituency/:constituencyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByConstituency(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
  ) {
    const documents = await this.documentsService.findByConstituency(constituencyId);

    return {
      success: true,
      data: documents,
    };
  }

  /**
   * Get document statistics for a constituency
   * GET /api/v1/documents/statistics/:constituencyId
   */
  @Get('statistics/:constituencyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getStatistics(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
  ) {
    const stats = await this.documentsService.getStatistics(constituencyId);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Verify document by file hash (public endpoint for QR verification)
   * POST /api/v1/documents/verify
   */
  @Post('verify')
  async verifyDocument(@Body() dto: VerifyDocumentDto) {
    const result = await this.documentsService.verifyByHash(dto.file_hash);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Create a new document record
   * POST /api/v1/documents
   * Note: File upload should be done separately to Supabase Storage
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: { id: string },
  ) {
    const document = await this.documentsService.create(dto, user.id);

    return {
      success: true,
      data: document,
    };
  }

  /**
   * Delete a document (only non-immutable)
   * DELETE /api/v1/documents/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'cdfc_chair', 'plgo')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.documentsService.delete(id, user.id);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  /**
   * Make a document immutable
   * POST /api/v1/documents/:id/immutable
   */
  @Post(':id/immutable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async makeImmutable(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const document = await this.documentsService.makeImmutable(id, user.id);

    return {
      success: true,
      data: document,
    };
  }
}
