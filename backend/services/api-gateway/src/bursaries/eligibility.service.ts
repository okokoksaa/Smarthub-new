import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateApplicationDto, InstitutionType } from './dto/create-application.dto';

export interface EligibilityCheck {
  check: string;
  passed: boolean;
  details?: string;
}

export interface EligibilityResult {
  is_eligible: boolean;
  checks: EligibilityCheck[];
  blockers: string[];
}

@Injectable()
export class EligibilityService {
  private readonly logger = new Logger(EligibilityService.name);
  private supabase: SupabaseClient;

  // Eligibility Rules
  private readonly MIN_RESIDENCY_MONTHS = 6;
  private readonly SKILLS_MIN_AGE = 18;
  private readonly SKILLS_MAX_AGE = 35;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Check eligibility for an existing application
   */
  async checkEligibility(applicationId: string): Promise<EligibilityResult> {
    const { data: application, error } = await this.supabase
      .from('bursary_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      throw new NotFoundException('Application not found');
    }

    return this.runEligibilityChecks({
      constituency_id: application.constituency_id,
      student_nrc: application.student_nrc,
      institution_type: application.institution_type,
      academic_year: application.academic_year,
      residency_start_date: application.residency_start_date,
      student_date_of_birth: application.student_date_of_birth,
    }, application.id);
  }

  /**
   * Pre-check eligibility before submission
   */
  async preCheckEligibility(dto: Partial<CreateApplicationDto>): Promise<EligibilityResult> {
    return this.runEligibilityChecks(dto);
  }

  /**
   * Run all eligibility checks
   */
  private async runEligibilityChecks(
    data: Partial<CreateApplicationDto>,
    applicationId?: string
  ): Promise<EligibilityResult> {
    const checks: EligibilityCheck[] = [];
    const blockers: string[] = [];

    // Check 1: Residency requirement (6 months)
    const residencyCheck = this.checkResidency(data.residency_start_date);
    checks.push(residencyCheck);
    if (!residencyCheck.passed) {
      blockers.push(residencyCheck.details || 'Residency requirement not met');
    }

    // Check 2: Youth age band for skills training (18-35)
    if (data.institution_type === InstitutionType.SKILLS) {
      const ageCheck = this.checkYouthAgeBand(data.student_date_of_birth);
      checks.push(ageCheck);
      if (!ageCheck.passed) {
        blockers.push(ageCheck.details || 'Age requirement not met for skills training');
      }
    } else {
      checks.push({
        check: 'youth_age_band',
        passed: true,
        details: 'Not applicable (non-skills institution)',
      });
    }

    // Check 3: No duplicate application for same year
    if (data.constituency_id && data.student_nrc && data.academic_year) {
      const duplicateCheck = await this.checkDuplicateApplication(
        data.constituency_id,
        data.student_nrc,
        data.academic_year,
        applicationId
      );
      checks.push(duplicateCheck);
      if (!duplicateCheck.passed) {
        blockers.push(duplicateCheck.details || 'Duplicate application exists');
      }
    }

    // Check 4: Admission letter (only for existing applications)
    if (applicationId && data.constituency_id) {
      const admissionCheck = await this.checkAdmissionLetterExists(applicationId, data.constituency_id);
      checks.push(admissionCheck);
      // Admission letter is a soft requirement - warn but don't block
      if (!admissionCheck.passed) {
        checks[checks.length - 1].details = 'Admission letter not uploaded (required before approval)';
      }
    }

    // Check 5: Constituency budget availability (for new applications)
    if (data.constituency_id && data.academic_year) {
      const budgetCheck = await this.checkBudgetAvailability(data.constituency_id, data.academic_year);
      checks.push(budgetCheck);
      if (!budgetCheck.passed) {
        blockers.push(budgetCheck.details || 'Insufficient bursary budget');
      }
    }

    return {
      is_eligible: blockers.length === 0,
      checks,
      blockers,
    };
  }

  /**
   * Check 1: Residency >= 6 months
   */
  private checkResidency(residencyStartDate?: string): EligibilityCheck {
    if (!residencyStartDate) {
      return {
        check: 'residency',
        passed: false,
        details: 'Residency start date not provided',
      };
    }

    const startDate = new Date(residencyStartDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 +
                       (now.getMonth() - startDate.getMonth());

    const passed = monthsDiff >= this.MIN_RESIDENCY_MONTHS;

    return {
      check: 'residency',
      passed,
      details: passed
        ? `Residency verified: ${monthsDiff} months`
        : `Residency requirement: ${this.MIN_RESIDENCY_MONTHS} months minimum, applicant has ${monthsDiff} months`,
    };
  }

  /**
   * Check 2: Youth age band for skills training (18-35)
   */
  private checkYouthAgeBand(dateOfBirth?: string): EligibilityCheck {
    if (!dateOfBirth) {
      return {
        check: 'youth_age_band',
        passed: false,
        details: 'Date of birth not provided for skills training applicant',
      };
    }

    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const passed = age >= this.SKILLS_MIN_AGE && age <= this.SKILLS_MAX_AGE;

    return {
      check: 'youth_age_band',
      passed,
      details: passed
        ? `Age verified: ${age} years (within ${this.SKILLS_MIN_AGE}-${this.SKILLS_MAX_AGE} range)`
        : `Skills training age requirement: ${this.SKILLS_MIN_AGE}-${this.SKILLS_MAX_AGE} years, applicant is ${age} years`,
    };
  }

  /**
   * Check 3: No duplicate applications
   */
  private async checkDuplicateApplication(
    constituencyId: string,
    studentNrc: string,
    academicYear: number,
    excludeApplicationId?: string
  ): Promise<EligibilityCheck> {
    let query = this.supabase
      .from('bursary_applications')
      .select('id, status')
      .eq('constituency_id', constituencyId)
      .eq('student_nrc', studentNrc)
      .eq('academic_year', academicYear)
      .not('status', 'in', '("rejected","withdrawn")');

    if (excludeApplicationId) {
      query = query.neq('id', excludeApplicationId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Error checking duplicate applications', error);
      return {
        check: 'no_duplicate',
        passed: true, // Fail open for DB errors
        details: 'Unable to verify duplicate applications',
      };
    }

    const hasDuplicate = data && data.length > 0;

    return {
      check: 'no_duplicate',
      passed: !hasDuplicate,
      details: hasDuplicate
        ? `Duplicate application found for ${academicYear} academic year (NRC: ${studentNrc})`
        : 'No duplicate applications found',
    };
  }

  /**
   * Check 4: Admission letter exists
   */
  private async checkAdmissionLetterExists(
    applicationId: string,
    constituencyId: string
  ): Promise<EligibilityCheck> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('id')
      .eq('constituency_id', constituencyId)
      .eq('document_type', 'admission_letter')
      .contains('metadata', { application_id: applicationId })
      .limit(1);

    if (error) {
      this.logger.error('Error checking admission letter', error);
      return {
        check: 'admission_letter',
        passed: false,
        details: 'Unable to verify admission letter',
      };
    }

    const exists = data && data.length > 0;

    return {
      check: 'admission_letter',
      passed: exists,
      details: exists
        ? 'Admission letter uploaded'
        : 'Admission letter not uploaded',
    };
  }

  /**
   * Check 5: Budget availability
   */
  private async checkBudgetAvailability(
    constituencyId: string,
    fiscalYear: number
  ): Promise<EligibilityCheck> {
    const { data: budget, error } = await this.supabase
      .from('budgets')
      .select('bursaries_allocation, disbursed_amount')
      .eq('constituency_id', constituencyId)
      .eq('fiscal_year', fiscalYear)
      .single();

    if (error || !budget) {
      return {
        check: 'budget_availability',
        passed: true, // Fail open if no budget record
        details: 'Budget record not found for this fiscal year',
      };
    }

    const available = (budget.bursaries_allocation || 0) - (budget.disbursed_amount || 0);
    const passed = available > 0;

    return {
      check: 'budget_availability',
      passed,
      details: passed
        ? `Budget available: K${available.toLocaleString()} for bursaries`
        : 'Bursary budget exhausted for this fiscal year',
    };
  }
}
