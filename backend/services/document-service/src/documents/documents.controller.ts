import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ApproveDocumentDto,
  QueryDocumentsDto,
} from './dto';
import { Document } from '@shared/database';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        documentType: { type: 'string' },
        accessLevel: { type: 'string' },
        description: { type: 'string' },
        projectId: { type: 'string' },
        constituencyId: { type: 'string' },
        wardId: { type: 'string' },
        districtId: { type: 'string' },
        provinceId: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: Document,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateDocumentDto,
    @Req() req: any,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.upload(file, createDto, userId);
  }

  @Post(':id/version')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new version of an existing document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'New version uploaded successfully',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async uploadVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.uploadVersion(id, file, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: [Document],
  })
  async findAll(
    @Query() queryDto: QueryDocumentsDto,
    @Req() req: any,
  ): Promise<{ documents: Document[]; total: number; page: number; limit: number }> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.findAll(queryDto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<Document> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.findOne(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a document' })
  @ApiResponse({
    status: 200,
    description: 'Document versions retrieved successfully',
    type: [Document],
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getVersions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Document[]> {
    return this.documentsService.getVersions(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponse({
    status: 200,
    description: 'Document downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user?.id || req.user?.sub;
    const { stream, filename, mimeType } = await this.documentsService.download(
      id,
      userId,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  @Get(':id/presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for document download' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPresignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('expirySeconds') expirySeconds: number = 3600,
    @Req() req: any,
  ): Promise<{ url: string; expiresIn: number }> {
    const userId = req.user?.id || req.user?.sub;
    const url = await this.documentsService.getPresignedUrl(id, userId, expirySeconds);
    return { url, expiresIn: expirySeconds };
  }

  // ------- API Gateway aligned endpoints -------

  @Post('verify')
  @ApiOperation({ summary: 'Verify document by file hash' })
  async verifyDocument(@Body() dto: { file_hash: string }) {
    const result = await this.documentsService.verifyByHash(dto.file_hash);
    return result;
  }

  @Get('constituency/:constituencyId')
  @ApiOperation({ summary: 'Get documents for a specific constituency' })
  async findByConstituency(@Param('constituencyId', ParseUUIDPipe) constituencyId: string) {
    return this.documentsService.findByConstituency(constituencyId);
  }

  @Get('statistics/:constituencyId')
  @ApiOperation({ summary: 'Get document statistics for a constituency' })
  async getStatisticsByConstituency(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
  ) {
    return this.documentsService.getStatisticsByConstituency(constituencyId);
  }

  @Post(':id/immutable')
  @ApiOperation({ summary: 'Mark a document as immutable' })
  async makeImmutable(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.makeImmutable(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDocumentDto,
    @Req() req: any,
  ): Promise<Document> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.update(id, updateDto, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject a document' })
  @ApiResponse({
    status: 200,
    description: 'Document approval status updated',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: ApproveDocumentDto,
    @Req() req: any,
  ): Promise<Document> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.approve(id, approveDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a document' })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user?.id || req.user?.sub;
    await this.documentsService.remove(id, userId);
    return { message: 'Document deleted successfully' };
  }

  @Get(':id/metadata')
  @ApiOperation({ summary: 'Get document metadata without downloading file' })
  @ApiResponse({
    status: 200,
    description: 'Document metadata retrieved successfully',
    type: Document,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<Document> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.findOne(id, userId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all documents for a specific project' })
  @ApiResponse({
    status: 200,
    description: 'Project documents retrieved successfully',
    type: [Document],
  })
  async getProjectDocuments(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Req() req: any,
  ): Promise<Document[]> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.getProjectDocuments(projectId, userId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get document statistics summary' })
  @ApiResponse({
    status: 200,
    description: 'Document statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalDocuments: { type: 'number' },
        totalSizeGB: { type: 'number' },
        documentsByType: { type: 'object' },
        documentsByAccessLevel: { type: 'object' },
        recentUploads: { type: 'array' },
      },
    },
  })
  async getStatistics(@Req() req: any): Promise<any> {
    const userId = req.user?.id || req.user?.sub;
    return this.documentsService.getStatistics(userId);
  }
}
