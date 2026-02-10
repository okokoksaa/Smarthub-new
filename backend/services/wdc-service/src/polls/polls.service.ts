import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, MoreThan, LessThan } from 'typeorm';
import {
  CommunityPoll,
  PollResponse,
  PollStatus,
  PollType,
} from './entities/poll.entity';
import {
  CreatePollDto,
  UpdatePollDto,
  SubmitResponseDto,
  PublishPollDto,
  ClosePollDto,
} from './dto/create-poll.dto';

/**
 * Polls Service
 * Handles community polling business logic
 */
@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(
    @InjectRepository(CommunityPoll)
    private readonly pollRepository: Repository<CommunityPoll>,
    @InjectRepository(PollResponse)
    private readonly responseRepository: Repository<PollResponse>,
  ) {}

  /**
   * Create a new community poll
   */
  async create(
    createPollDto: CreatePollDto,
    createdBy: string,
  ): Promise<CommunityPoll> {
    try {
      // Get geographic data based on wardId
      const geographicData = await this.getGeographicData(createPollDto.wardId);

      // Validate dates
      const startDate = new Date(createPollDto.startDate);
      const endDate = new Date(createPollDto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (endDate <= new Date()) {
        throw new BadRequestException('End date must be in the future');
      }

      // Validate options for certain poll types
      if ([PollType.MULTIPLE_CHOICE, PollType.RANKING].includes(createPollDto.type)) {
        if (!createPollDto.options || createPollDto.options.length < 2) {
          throw new BadRequestException('Multiple choice and ranking polls require at least 2 options');
        }
      }

      const poll = this.pollRepository.create({
        ...createPollDto,
        ...geographicData,
        startDate,
        endDate,
        createdBy,
        // Set defaults for optional fields
        allowMultipleResponses: createPollDto.allowMultipleResponses ?? false,
        requireAuthentication: createPollDto.requireAuthentication ?? true,
        anonymousResponses: createPollDto.anonymousResponses ?? false,
        maxResponsesPerUser: createPollDto.maxResponsesPerUser ?? 1,
        resultsVisible: createPollDto.resultsVisible ?? false,
      });

      const savedPoll = await this.pollRepository.save(poll);
      
      this.logger.log(`Created poll "${savedPoll.title}" by user ${createdBy}`);
      
      return savedPoll;
    } catch (error) {
      this.logger.error(`Failed to create poll: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create poll');
    }
  }

  /**
   * Get all polls with filtering and pagination
   */
  async findAll(
    wardId?: string,
    status?: PollStatus,
    active?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{
    polls: CommunityPoll[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = { isActive: true };

    // Apply ward filtering
    if (wardId) {
      where.wardId = wardId;
    }

    // Apply status filtering
    if (status) {
      where.status = status;
    }

    // Apply active filtering (currently open polls)
    if (active !== undefined && active) {
      where.status = PollStatus.ACTIVE;
      where.startDate = LessThan(new Date());
      where.endDate = MoreThan(new Date());
    }

    const options: FindManyOptions<CommunityPoll> = {
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [polls, total] = await this.pollRepository.findAndCount(options);

    return {
      polls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get poll by ID
   */
  async findOne(id: string): Promise<CommunityPoll> {
    const poll = await this.pollRepository.findOne({
      where: { id, isActive: true },
    });

    if (!poll) {
      throw new NotFoundException(`Poll with ID ${id} not found`);
    }

    return poll;
  }

  /**
   * Update poll (only draft polls can be updated)
   */
  async update(
    id: string,
    updatePollDto: UpdatePollDto,
    userId: string,
  ): Promise<CommunityPoll> {
    const poll = await this.findOne(id);

    // Only allow updates on draft polls
    if (poll.status !== PollStatus.DRAFT) {
      throw new BadRequestException('Can only update draft polls');
    }

    // Validate dates if provided
    if (updatePollDto.startDate || updatePollDto.endDate) {
      const startDate = updatePollDto.startDate ? new Date(updatePollDto.startDate) : poll.startDate;
      const endDate = updatePollDto.endDate ? new Date(updatePollDto.endDate) : poll.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (endDate <= new Date()) {
        throw new BadRequestException('End date must be in the future');
      }

      poll.startDate = startDate;
      poll.endDate = endDate;
    }

    // Update other fields
    if (updatePollDto.title) poll.title = updatePollDto.title;
    if (updatePollDto.description) poll.description = updatePollDto.description;
    if (updatePollDto.options) poll.options = updatePollDto.options;
    if (updatePollDto.resultsVisible !== undefined) poll.resultsVisible = updatePollDto.resultsVisible;

    poll.updatedBy = userId;

    const savedPoll = await this.pollRepository.save(poll);
    
    this.logger.log(`Updated poll ${savedPoll.id} by user ${userId}`);
    
    return savedPoll;
  }

  /**
   * Publish a poll (make it active)
   */
  async publish(
    id: string,
    publishDto: PublishPollDto,
    userId: string,
  ): Promise<CommunityPoll> {
    const poll = await this.findOne(id);

    if (poll.status !== PollStatus.DRAFT) {
      throw new BadRequestException('Can only publish draft polls');
    }

    if (publishDto.publish) {
      // Validate poll is ready for publishing
      if (poll.startDate <= new Date() && poll.endDate <= new Date()) {
        throw new BadRequestException('Cannot publish poll with end date in the past');
      }

      poll.status = PollStatus.ACTIVE;
      poll.publishedBy = userId;
      poll.publishedAt = new Date();
    }

    poll.updatedBy = userId;

    const savedPoll = await this.pollRepository.save(poll);
    
    const action = publishDto.publish ? 'published' : 'unpublished';
    this.logger.log(`Poll ${savedPoll.id} ${action} by user ${userId}`);
    
    return savedPoll;
  }

  /**
   * Submit a response to a poll
   */
  async submitResponse(
    pollId: string,
    responseDto: SubmitResponseDto,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PollResponse> {
    const poll = await this.findOne(pollId);

    // Validate poll is open
    if (!poll.isOpen) {
      throw new BadRequestException('Poll is not currently open for responses');
    }

    // Check authentication requirements
    if (poll.requireAuthentication && !userId) {
      throw new BadRequestException('Authentication required for this poll');
    }

    // Check if user has already responded
    if (userId && !poll.allowMultipleResponses) {
      const existingResponse = await this.responseRepository.findOne({
        where: { pollId, userId, isActive: true },
      });

      if (existingResponse) {
        throw new BadRequestException('You have already responded to this poll');
      }
    }

    // Validate response format based on poll type
    await this.validateResponse(poll, responseDto.response);

    const response = this.responseRepository.create({
      pollId,
      userId: poll.anonymousResponses ? null : userId,
      sessionId: responseDto.sessionId,
      response: responseDto.response,
      comments: responseDto.comments,
      ipAddress,
      userAgent,
    });

    const savedResponse = await this.responseRepository.save(response);

    // Update poll statistics
    await this.updatePollStatistics(poll);

    this.logger.log(`Response submitted to poll ${pollId} by ${userId || 'anonymous user'}`);

    return savedResponse;
  }

  /**
   * Close a poll
   */
  async close(
    id: string,
    closeDto: ClosePollDto,
    userId: string,
  ): Promise<CommunityPoll> {
    const poll = await this.findOne(id);

    if (poll.status !== PollStatus.ACTIVE) {
      throw new BadRequestException('Can only close active polls');
    }

    poll.status = PollStatus.CLOSED;
    poll.closedBy = userId;
    poll.closedAt = new Date();
    poll.updatedBy = userId;

    if (closeDto.makeResultsVisible !== undefined) {
      poll.resultsVisible = closeDto.makeResultsVisible;
    }

    // Calculate final results
    poll.results = await this.calculateResults(poll);

    const savedPoll = await this.pollRepository.save(poll);
    
    this.logger.log(`Poll ${savedPoll.id} closed by user ${userId}. Reason: ${closeDto.reason || 'No reason provided'}`);
    
    return savedPoll;
  }

  /**
   * Get poll responses
   */
  async getResponses(
    pollId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    responses: PollResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const options: FindManyOptions<PollResponse> = {
      where: { pollId, isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [responses, total] = await this.responseRepository.findAndCount(options);

    return {
      responses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get poll results (if visible)
   */
  async getResults(pollId: string, userId?: string): Promise<Record<string, any>> {
    const poll = await this.findOne(pollId);

    // Check if results are visible to this user
    if (!poll.resultsVisible && poll.createdBy !== userId) {
      throw new ForbiddenException('Poll results are not visible yet');
    }

    if (!poll.results) {
      // Calculate results on-demand if not cached
      poll.results = await this.calculateResults(poll);
      await this.pollRepository.save(poll);
    }

    return poll.results;
  }

  /**
   * Get poll statistics
   */
  async getStatistics(wardId?: string): Promise<{
    total: number;
    active: number;
    closed: number;
    draft: number;
    totalResponses: number;
    averageParticipation: number;
  }> {
    const where: any = { isActive: true };
    if (wardId) {
      where.wardId = wardId;
    }

    const [
      total,
      active,
      closed,
      draft,
      allPolls,
    ] = await Promise.all([
      this.pollRepository.count({ where }),
      this.pollRepository.count({ where: { ...where, status: PollStatus.ACTIVE } }),
      this.pollRepository.count({ where: { ...where, status: PollStatus.CLOSED } }),
      this.pollRepository.count({ where: { ...where, status: PollStatus.DRAFT } }),
      this.pollRepository.find({ where }),
    ]);

    const totalResponses = allPolls.reduce((sum, poll) => sum + poll.totalResponses, 0);
    const averageParticipation = total > 0 ? Math.round(totalResponses / total) : 0;

    return {
      total,
      active,
      closed,
      draft,
      totalResponses,
      averageParticipation,
    };
  }

  /**
   * Soft delete poll
   */
  async remove(id: string, userId: string): Promise<void> {
    const poll = await this.findOne(id);

    // Only allow deletion of draft polls
    if (poll.status !== PollStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft polls');
    }

    poll.isActive = false;
    poll.updatedBy = userId;

    await this.pollRepository.save(poll);
    
    this.logger.log(`Deleted poll ${poll.id} by user ${userId}`);
  }

  /**
   * Validate response format based on poll type
   */
  private async validateResponse(poll: CommunityPoll, response: Record<string, any>): Promise<void> {
    switch (poll.type) {
      case PollType.MULTIPLE_CHOICE:
        if (!response.selectedOptions || !Array.isArray(response.selectedOptions)) {
          throw new BadRequestException('Multiple choice polls require selectedOptions array');
        }
        
        if (!poll.allowMultipleResponses && response.selectedOptions.length > 1) {
          throw new BadRequestException('This poll allows only one selection');
        }

        // Validate options exist
        const validOptions = poll.options || [];
        const invalidOptions = response.selectedOptions.filter(option => !validOptions.includes(option));
        if (invalidOptions.length > 0) {
          throw new BadRequestException(`Invalid options: ${invalidOptions.join(', ')}`);
        }
        break;

      case PollType.YES_NO:
        if (!response.answer || !['yes', 'no'].includes(response.answer.toLowerCase())) {
          throw new BadRequestException('Yes/No polls require answer field with "yes" or "no"');
        }
        break;

      case PollType.RANKING:
        if (!response.ranking || !Array.isArray(response.ranking)) {
          throw new BadRequestException('Ranking polls require ranking array');
        }
        // Additional ranking validation could be added here
        break;

      case PollType.OPEN_TEXT:
        if (!response.text || typeof response.text !== 'string') {
          throw new BadRequestException('Open text polls require text field');
        }
        break;

      default:
        throw new BadRequestException('Unknown poll type');
    }
  }

  /**
   * Calculate poll results
   */
  private async calculateResults(poll: CommunityPoll): Promise<Record<string, any>> {
    const responses = await this.responseRepository.find({
      where: { pollId: poll.id, isActive: true },
    });

    const results: Record<string, any> = {
      totalResponses: responses.length,
      responsesByType: {},
    };

    switch (poll.type) {
      case PollType.MULTIPLE_CHOICE:
        const optionCounts: Record<string, number> = {};
        poll.options?.forEach(option => optionCounts[option] = 0);
        
        responses.forEach(response => {
          if (response.response.selectedOptions) {
            response.response.selectedOptions.forEach((option: string) => {
              optionCounts[option] = (optionCounts[option] || 0) + 1;
            });
          }
        });
        
        results.responsesByType = optionCounts;
        results.percentages = {};
        Object.keys(optionCounts).forEach(option => {
          results.percentages[option] = responses.length > 0 
            ? Math.round((optionCounts[option] / responses.length) * 100) 
            : 0;
        });
        break;

      case PollType.YES_NO:
        const yesCount = responses.filter(r => r.response.answer?.toLowerCase() === 'yes').length;
        const noCount = responses.filter(r => r.response.answer?.toLowerCase() === 'no').length;
        
        results.responsesByType = { yes: yesCount, no: noCount };
        results.percentages = {
          yes: responses.length > 0 ? Math.round((yesCount / responses.length) * 100) : 0,
          no: responses.length > 0 ? Math.round((noCount / responses.length) * 100) : 0,
        };
        break;

      case PollType.RANKING:
        // Calculate average ranking for each option
        const rankings: Record<string, number[]> = {};
        responses.forEach(response => {
          if (response.response.ranking) {
            response.response.ranking.forEach((option: string, index: number) => {
              if (!rankings[option]) rankings[option] = [];
              rankings[option].push(index + 1); // 1-based ranking
            });
          }
        });
        
        results.responsesByType = {};
        Object.keys(rankings).forEach(option => {
          const ranks = rankings[option];
          const average = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
          results.responsesByType[option] = {
            averageRank: Math.round(average * 100) / 100,
            totalVotes: ranks.length,
          };
        });
        break;

      case PollType.OPEN_TEXT:
        results.responsesByType = {
          responses: responses.map(r => ({
            text: r.response.text,
            timestamp: r.createdAt,
          })),
        };
        break;
    }

    return results;
  }

  /**
   * Update poll statistics
   */
  private async updatePollStatistics(poll: CommunityPoll): Promise<void> {
    const totalResponses = await this.responseRepository.count({
      where: { pollId: poll.id, isActive: true },
    });

    const uniqueParticipants = await this.responseRepository
      .createQueryBuilder('response')
      .select('COUNT(DISTINCT COALESCE(response.userId, response.sessionId))')
      .where('response.pollId = :pollId', { pollId: poll.id })
      .andWhere('response.isActive = true')
      .getRawOne();

    poll.totalResponses = totalResponses;
    poll.uniqueParticipants = parseInt(uniqueParticipants.count, 10);

    await this.pollRepository.save(poll);
  }

  /**
   * Get geographic data based on ward ID
   * TODO: Implement proper database lookup
   */
  private async getGeographicData(wardId: string): Promise<{
    constituencyId: string;
    districtId: string;
    provinceId: string;
  }> {
    // This is a simplified implementation
    // In a real system, you would query the wards table to get the geographic hierarchy
    return {
      constituencyId: 'dummy-constituency-id',
      districtId: 'dummy-district-id',
      provinceId: 'dummy-province-id',
    };
  }
}