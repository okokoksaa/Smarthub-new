import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import {
  WdcApplication,
  ApplicationStatus,
  WdcApplicationDocument,
} from './entities/application.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  SubmitApplicationDto,
  ReviewApplicationDto,
  VerifyResidencyDto,
} from './dto/create-application.dto';

/**
 * Applications Service
 * Handles WDC application business logic
 */
@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(WdcApplication)
    private readonly applicationRepository: Repository<WdcApplication>,
    @InjectRepository(WdcApplicationDocument)
    private readonly documentRepository: Repository<WdcApplicationDocument>,
  ) {}

  /**
   * Create a new WDC application
   */
  async create(
    createApplicationDto: CreateApplicationDto,
    createdBy: string,
  ): Promise<WdcApplication> {
    try {
      // Get geographic IDs based on wardId
      const geographicData = await this.getGeographicData(createApplicationDto.wardId);

      const application = this.applicationRepository.create({
        ...createApplicationDto,
        ...geographicData,
        createdBy,
      });

      const savedApplication = await this.applicationRepository.save(application);
      
      this.logger.log(`Created application ${savedApplication.applicationNumber} by user ${createdBy}`);
      
      return savedApplication;
    } catch (error) {
      this.logger.error(`Failed to create application: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create application');
    }
  }

  /**
   * Get all applications with filtering and pagination
   */
  async findAll(
    wardId?: string,
    status?: ApplicationStatus,
    page = 1,
    limit = 10,
    userId?: string,
  ): Promise<{
    applications: WdcApplication[];
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

    // Apply user filtering (user can only see their own applications unless they have ward access)
    if (userId && !wardId) {
      where.createdBy = userId;
    }

    const options: FindManyOptions<WdcApplication> = {
      where,
      relations: ['documents'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [applications, total] = await this.applicationRepository.findAndCount(options);

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get application by ID
   */
  async findOne(id: string, userId?: string): Promise<WdcApplication> {
    const options: FindOneOptions<WdcApplication> = {
      where: { id, isActive: true },
      relations: ['documents'],
    };

    const application = await this.applicationRepository.findOne(options);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Check if user has access to this application
    if (userId && application.createdBy !== userId) {
      // TODO: Add proper ward-level access check here
      this.logger.warn(`User ${userId} attempted to access application ${id} without permission`);
    }

    return application;
  }

  /**
   * Update application
   */
  async update(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
    userId: string,
  ): Promise<WdcApplication> {
    const application = await this.findOne(id, userId);

    // Only allow updates on draft applications
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Can only update applications in DRAFT status');
    }

    // Only allow creator to update
    if (application.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own applications');
    }

    Object.assign(application, updateApplicationDto);
    application.updatedBy = userId;

    const savedApplication = await this.applicationRepository.save(application);
    
    this.logger.log(`Updated application ${savedApplication.applicationNumber} by user ${userId}`);
    
    return savedApplication;
  }

  /**
   * Submit application for WDC review
   */
  async submit(
    id: string,
    submitDto: SubmitApplicationDto,
    userId: string,
  ): Promise<WdcApplication> {
    const application = await this.findOne(id, userId);

    // Validate submission requirements
    this.validateSubmissionRequirements(application, userId);

    application.status = ApplicationStatus.SUBMITTED;
    application.submittedAt = new Date();
    application.updatedBy = userId;

    const savedApplication = await this.applicationRepository.save(application);
    
    this.logger.log(`Submitted application ${savedApplication.applicationNumber} by user ${userId}`);
    
    return savedApplication;
  }

  /**
   * Review application (WDC approval/rejection)
   */
  async review(
    id: string,
    reviewDto: ReviewApplicationDto,
    reviewerId: string,
  ): Promise<WdcApplication> {
    const application = await this.findOne(id);

    // Only submitted applications can be reviewed
    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException('Can only review submitted applications');
    }

    // Update application based on review decision
    application.status = reviewDto.decision === 'approve' 
      ? ApplicationStatus.WDC_APPROVED 
      : ApplicationStatus.WDC_REJECTED;
    
    application.wdcReviewedAt = new Date();
    application.wdcReviewComments = reviewDto.reviewComments;
    application.wdcApprovedBy = reviewerId;
    application.updatedBy = reviewerId;

    const savedApplication = await this.applicationRepository.save(application);
    
    this.logger.log(
      `Reviewed application ${savedApplication.applicationNumber}: ${reviewDto.decision} by user ${reviewerId}`,
    );
    
    return savedApplication;
  }

  /**
   * Verify applicant residency
   */
  async verifyResidency(
    id: string,
    verifyDto: VerifyResidencyDto,
    verifierId: string,
  ): Promise<WdcApplication> {
    const application = await this.findOne(id);

    application.residencyVerified = verifyDto.verified;
    application.residencyVerifiedBy = verifierId;
    application.residencyVerifiedAt = new Date();
    application.updatedBy = verifierId;

    const savedApplication = await this.applicationRepository.save(application);
    
    this.logger.log(
      `Verified residency for application ${savedApplication.applicationNumber}: ${verifyDto.verified} by user ${verifierId}`,
    );
    
    return savedApplication;
  }

  /**
   * Forward application to CDFC
   */
  async forwardToCdfc(id: string, userId: string): Promise<WdcApplication> {
    const application = await this.findOne(id);

    // Validate forwarding requirements
    if (!application.canForwardToCdfc) {
      throw new BadRequestException(
        'Application cannot be forwarded to CDFC. Ensure it is WDC approved, has meeting minutes, and residency is verified.',
      );
    }

    application.status = ApplicationStatus.FORWARDED_TO_CDFC;
    application.updatedBy = userId;

    const savedApplication = await this.applicationRepository.save(application);
    
    this.logger.log(
      `Forwarded application ${savedApplication.applicationNumber} to CDFC by user ${userId}`,
    );
    
    return savedApplication;
  }

  /**
   * Get application statistics
   */
  async getStatistics(wardId?: string): Promise<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
    forwarded: number;
  }> {
    const where: any = { isActive: true };
    if (wardId) {
      where.wardId = wardId;
    }

    const [
      total,
      draft,
      submitted,
      approved,
      rejected,
      forwarded,
    ] = await Promise.all([
      this.applicationRepository.count({ where }),
      this.applicationRepository.count({ where: { ...where, status: ApplicationStatus.DRAFT } }),
      this.applicationRepository.count({ where: { ...where, status: ApplicationStatus.SUBMITTED } }),
      this.applicationRepository.count({ where: { ...where, status: ApplicationStatus.WDC_APPROVED } }),
      this.applicationRepository.count({ where: { ...where, status: ApplicationStatus.WDC_REJECTED } }),
      this.applicationRepository.count({ where: { ...where, status: ApplicationStatus.FORWARDED_TO_CDFC } }),
    ]);

    return {
      total,
      draft,
      submitted,
      approved,
      rejected,
      forwarded,
    };
  }

  /**
   * Soft delete application
   */
  async remove(id: string, userId: string): Promise<void> {
    const application = await this.findOne(id, userId);

    // Only allow deletion of draft applications by creator
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Can only delete applications in DRAFT status');
    }

    if (application.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own applications');
    }

    application.isActive = false;
    application.updatedBy = userId;

    await this.applicationRepository.save(application);
    
    this.logger.log(`Deleted application ${application.applicationNumber} by user ${userId}`);
  }

  /**
   * Validate submission requirements
   */
  private validateSubmissionRequirements(application: WdcApplication, userId: string): void {
    if (application.createdBy !== userId) {
      throw new ForbiddenException('You can only submit your own applications');
    }

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Can only submit applications in DRAFT status');
    }

    if (!application.canSubmit) {
      const errors: string[] = [];
      
      if (!application.residencyVerified) {
        errors.push('Residency verification required');
      }
      
      if (!application.meetingMinutesAttached) {
        errors.push('Meeting minutes attachment required');
      }
      
      const hasVerifiedDocuments = application.documents?.some(doc => 
        doc.isActive && doc.verified
      );
      
      if (!hasVerifiedDocuments) {
        errors.push('At least one verified supporting document required');
      }

      throw new BadRequestException(`Cannot submit application: ${errors.join(', ')}`);
    }
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