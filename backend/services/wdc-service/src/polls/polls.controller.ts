import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Roles, UserRole } from '../auth/roles.decorator';
import { Public } from '../auth/jwt.guard';
import { PollsService } from './polls.service';
import { PollStatus } from './entities/poll.entity';
import {
  CreatePollDto,
  UpdatePollDto,
  SubmitResponseDto,
  PublishPollDto,
  ClosePollDto,
} from './dto/create-poll.dto';

/**
 * Community Polls Controller
 * Handles HTTP requests for Ward-scoped community polling
 */
@ApiTags('Community Polls')
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  /**
   * Create a new community poll
   */
  @Post()
  @Roles(UserRole.WDC_CHAIRPERSON, UserRole.WDC_SECRETARY)
  @ApiOperation({ summary: 'Create a new community poll (draft)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Poll created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid poll data',
  })
  async create(
    @Body() createPollDto: CreatePollDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.pollsService.create(createPollDto, userId);
  }

  /**
   * Get all polls with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all community polls with filtering and pagination' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter by ward ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PollStatus,
    description: 'Filter by poll status',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter for currently active polls only',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Polls retrieved successfully',
  })
  async findAll(
    @Query('wardId') wardId?: string,
    @Query('status') status?: PollStatus,
    @Query('active') active?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pollsService.findAll(
      wardId,
      status,
      active,
      page || 1,
      limit || 10,
    );
  }

  /**
   * Get poll statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get community polling statistics' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter statistics by ward ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Query('wardId') wardId?: string) {
    return this.pollsService.getStatistics(wardId);
  }

  /**
   * Get poll by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Poll retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Poll not found',
  })
  async findOne(@Param('id') id: string) {
    return this.pollsService.findOne(id);
  }

  /**
   * Update poll (only draft polls)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update poll (only draft polls)' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Poll updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update non-draft poll',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePollDto: UpdatePollDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.pollsService.update(id, updatePollDto, userId);
  }

  /**
   * Publish poll (make it active)
   */
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish poll to make it active' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Poll publication status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot publish non-draft poll',
  })
  async publish(
    @Param('id') id: string,
    @Body() publishDto: PublishPollDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.pollsService.publish(id, publishDto, userId);
  }

  /**
   * Submit response to poll
   */
  @Post(':id/responses')
  @ApiOperation({ summary: 'Submit a response to an active poll' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Response submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Poll not open, invalid response, or user already responded',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Authentication required for this poll',
  })
  async submitResponse(
    @Param('id') id: string,
    @Body() responseDto: SubmitResponseDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    // TODO: Extract user ID from JWT token (if authenticated)
    const userId = req.user?.id;
    
    return this.pollsService.submitResponse(
      id,
      responseDto,
      userId,
      ip,
      userAgent,
    );
  }

  /**
   * Get poll responses (admin/creator only)
   */
  @Get(':id/responses')
  @ApiOperation({ summary: 'Get poll responses (admin/creator only)' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Responses retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to view responses',
  })
  async getResponses(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pollsService.getResponses(
      id,
      page || 1,
      limit || 20,
    );
  }

  /**
   * Get poll results
   */
  @Get(':id/results')
  @ApiOperation({ summary: 'Get poll results (if visible)' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Results retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Results are not visible yet',
  })
  async getResults(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id;
    
    return this.pollsService.getResults(id, userId);
  }

  /**
   * Close poll
   */
  @Post(':id/close')
  @ApiOperation({ summary: 'Close an active poll' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Poll closed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot close non-active poll',
  })
  async close(
    @Param('id') id: string,
    @Body() closeDto: ClosePollDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.pollsService.close(id, closeDto, userId);
  }

  /**
   * Delete poll
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete poll (only draft polls)' })
  @ApiParam({
    name: 'id',
    description: 'Poll ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Poll deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete non-draft poll',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    await this.pollsService.remove(id, userId);
    return { message: 'Poll deleted successfully' };
  }
}