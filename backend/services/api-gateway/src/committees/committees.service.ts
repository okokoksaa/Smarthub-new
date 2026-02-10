import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCommitteeDto,
  AddMemberDto,
  CreateMeetingDto,
  RecordAttendanceDto,
  ConflictOfInterestDto,
  RecordVoteDto,
  UploadMinutesDto,
  ApproveMinutesDto,
} from './dto/committee.dto';

@Injectable()
export class CommitteesService {
  private readonly logger = new Logger(CommitteesService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  // ==================== COMMITTEES ====================

  async findAllCommittees(filters: any) {
    const { type, constituencyId, provinceId, page = 1, limit = 20 } = filters;

    let query = this.supabase
      .from('committees')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        province:provinces(id, name),
        chair:profiles!committees_chair_id_fkey(id, email, first_name, last_name),
        secretary:profiles!committees_secretary_id_fkey(id, email, first_name, last_name),
        members:committee_members(
          id, role, is_active,
          user:profiles(id, email, first_name, last_name)
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('committee_type', type);
    if (constituencyId) query = query.eq('constituency_id', constituencyId);
    if (provinceId) query = query.eq('province_id', provinceId);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      this.logger.error('Failed to fetch committees', error);
      throw new BadRequestException('Failed to fetch committees');
    }

    return { data, pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) } };
  }

  async findOneCommittee(id: string) {
    const { data, error } = await this.supabase
      .from('committees')
      .select(`
        *,
        constituency:constituencies(id, name, code),
        province:provinces(id, name),
        chair:profiles!committees_chair_id_fkey(id, email, first_name, last_name),
        secretary:profiles!committees_secretary_id_fkey(id, email, first_name, last_name),
        members:committee_members(
          id, role, is_active, joined_at,
          user:profiles(id, email, first_name, last_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Committee with ID ${id} not found`);
    }

    return data;
  }

  async createCommittee(dto: CreateCommitteeDto, user: any) {
    // Enforcement: Minimum quorum for CDFC is 6
    let quorumRequired = dto.quorum_required;
    if (dto.committee_type === 'cdfc') {
      quorumRequired = Math.max(6, Number(quorumRequired || 0));
    }
    const { data: committee, error } = await this.supabase
      .from('committees')
      .insert({
        name: dto.name,
        committee_type: dto.committee_type,
        constituency_id: dto.constituency_id,
        province_id: dto.province_id,
        chair_id: dto.chair_id,
        secretary_id: dto.secretary_id,
        quorum_required: quorumRequired,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create committee', error);
      throw new BadRequestException('Failed to create committee');
    }

    await this.logAudit(user.id, 'committee.created', 'committee', committee.id, dto);
    return committee;
  }

  async addMember(committeeId: string, dto: AddMemberDto, user: any) {
    // Check if member already exists
    const { data: existing } = await this.supabase
      .from('committee_members')
      .select('id')
      .eq('committee_id', committeeId)
      .eq('user_id', dto.user_id)
      .single();

    if (existing) {
      throw new BadRequestException('User is already a member of this committee');
    }

    const { data: member, error } = await this.supabase
      .from('committee_members')
      .insert({
        committee_id: committeeId,
        user_id: dto.user_id,
        role: dto.role,
        is_active: true,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to add member');
    }

    await this.logAudit(user.id, 'committee.member_added', 'committee', committeeId, dto);
    return member;
  }

  async removeMember(committeeId: string, userId: string, user: any) {
    const { error } = await this.supabase
      .from('committee_members')
      .update({
        is_active: false,
        left_at: new Date().toISOString(),
      })
      .eq('committee_id', committeeId)
      .eq('user_id', userId);

    if (error) {
      throw new BadRequestException('Failed to remove member');
    }

    await this.logAudit(user.id, 'committee.member_removed', 'committee', committeeId, { removed_user_id: userId });
    return { success: true };
  }

  // ==================== MEETINGS ====================

  async findAllMeetings(filters: any) {
    const { committeeId, status, fromDate, toDate, page = 1, limit = 20 } = filters;

    let query = this.supabase
      .from('meetings')
      .select(`
        *,
        committee:committees(id, name, committee_type),
        created_by_user:profiles!meetings_created_by_fkey(id, email, first_name, last_name),
        attendees:meeting_attendees(
          id, attended, attendance_time,
          user:profiles(id, email, first_name, last_name)
        )
      `, { count: 'exact' })
      .order('meeting_date', { ascending: false });

    if (committeeId) query = query.eq('committee_id', committeeId);
    if (status) query = query.eq('status', status);
    if (fromDate) query = query.gte('meeting_date', fromDate);
    if (toDate) query = query.lte('meeting_date', toDate);

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new BadRequestException('Failed to fetch meetings');
    }

    return { data, pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) } };
  }

  async findOneMeeting(id: string) {
    const { data, error } = await this.supabase
      .from('meetings')
      .select(`
        *,
        committee:committees(id, name, committee_type, quorum_required),
        created_by_user:profiles!meetings_created_by_fkey(id, email, first_name, last_name),
        attendees:meeting_attendees(
          id, attended, attendance_time, signature,
          user:profiles(id, email, first_name, last_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return data;
  }

  async createMeeting(dto: CreateMeetingDto, user: any) {
    const { data: meeting, error } = await this.supabase
      .from('meetings')
      .insert({
        committee_id: dto.committee_id,
        title: dto.title,
        description: dto.description,
        meeting_date: dto.meeting_date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        venue: dto.venue,
        status: 'scheduled',
        agenda: dto.agenda,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create meeting', error);
      throw new BadRequestException('Failed to create meeting');
    }

    // Add all committee members as potential attendees
    const { data: members } = await this.supabase
      .from('committee_members')
      .select('user_id')
      .eq('committee_id', dto.committee_id)
      .eq('is_active', true);

    if (members && members.length > 0) {
      const attendees = members.map(m => ({
        meeting_id: meeting.id,
        user_id: m.user_id,
        attended: false,
      }));

      await this.supabase.from('meeting_attendees').insert(attendees);
    }

    await this.logAudit(user.id, 'meeting.created', 'meeting', meeting.id, dto);
    return meeting;
  }

  async recordAttendance(meetingId: string, dto: RecordAttendanceDto, user: any) {
    const { data, error } = await this.supabase
      .from('meeting_attendees')
      .upsert({
        meeting_id: meetingId,
        user_id: dto.user_id,
        attended: dto.attended,
        attendance_time: dto.attendance_time || new Date().toISOString(),
        signature: dto.signature,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to record attendance');
    }

    // Update quorum count on meeting
    const { count: attendedCount } = await this.supabase
      .from('meeting_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('meeting_id', meetingId)
      .eq('attended', true);

    await this.supabase
      .from('meetings')
      .update({ quorum_present: attendedCount })
      .eq('id', meetingId);

    await this.logAudit(user.id, 'meeting.attendance_recorded', 'meeting', meetingId, dto);
    return data;
  }

  async recordConflictOfInterest(meetingId: string, dto: ConflictOfInterestDto, user: any) {
    // Store COI in meeting metadata
    const { data: meeting } = await this.supabase
      .from('meetings')
      .select('agenda')
      .eq('id', meetingId)
      .single();

    const agenda = meeting?.agenda || [];
    const updatedAgenda = agenda.map((item: any) => {
      if (item.item === dto.agenda_item) {
        return {
          ...item,
          conflicts_of_interest: [
            ...(item.conflicts_of_interest || []),
            {
              user_id: dto.user_id,
              description: dto.conflict_description,
              will_recuse: dto.will_recuse,
              declared_at: new Date().toISOString(),
            },
          ],
        };
      }
      return item;
    });

    await this.supabase
      .from('meetings')
      .update({ agenda: updatedAgenda })
      .eq('id', meetingId);

    await this.logAudit(user.id, 'meeting.coi_declared', 'meeting', meetingId, dto);
    return { success: true, message: 'Conflict of interest recorded' };
  }

  async recordVote(meetingId: string, dto: RecordVoteDto, user: any) {
    const { data: meeting } = await this.supabase
      .from('meetings')
      .select('agenda, quorum_present, status, committee:committees(id, quorum_required)')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const committee = meeting.committee as any;

    // ENFORCEMENT 1: Meeting status check - prevent voting on completed meetings
    if (meeting.status === 'completed') {
      throw new BadRequestException(
        'ENFORCEMENT: Cannot vote on a completed meeting. Minutes have been finalized.'
      );
    }

    // ENFORCEMENT 2: Voter eligibility - verify voter is active committee member
    const isEligible = await this.isVoterEligible(committee.id, dto.voter_id);
    if (!isEligible) {
      throw new ForbiddenException(
        'ENFORCEMENT: Voter is not an active member of this committee.'
      );
    }

    // ENFORCEMENT 3: Quorum check
    if (meeting.quorum_present < committee.quorum_required) {
      throw new BadRequestException(
        `ENFORCEMENT: Quorum not met. ${meeting.quorum_present}/${committee.quorum_required} members present. ` +
        'Vote cannot be recorded. (Ref: CDF Act Section 12(4))'
      );
    }

    // ENFORCEMENT 4: Check for duplicate vote - prevent same voter from voting twice
    const agendaItem = meeting.agenda?.find((a: any) => a.item === dto.agenda_item);
    if (agendaItem?.votes) {
      const existingVote = agendaItem.votes.find((v: any) => v.voter_id === dto.voter_id);
      if (existingVote) {
        throw new BadRequestException(
          'ENFORCEMENT: Voter has already voted on this agenda item. ' +
          `Previous vote: ${existingVote.vote} at ${existingVote.recorded_at}`
        );
      }
    }

    // ENFORCEMENT 5: COI check - prevent voting if ANY COI declared (not just will_recuse)
    if (agendaItem?.conflicts_of_interest) {
      const voterCoi = agendaItem.conflicts_of_interest.find(
        (c: any) => c.user_id === dto.voter_id
      );
      if (voterCoi) {
        if (voterCoi.will_recuse) {
          throw new BadRequestException(
            'ENFORCEMENT: Voter has declared conflict of interest and elected to recuse. Voting not allowed.'
          );
        } else {
          // Log warning but allow vote - COI is on record
          this.logger.warn(
            `GOVERNANCE WARNING: Voter ${dto.voter_id} voting despite declared COI on "${dto.agenda_item}". ` +
            `COI: "${voterCoi.description}". Vote will be flagged.`
          );
        }
      }
    }

    // Record vote in agenda with COI flag if applicable
    const hasCoi = agendaItem?.conflicts_of_interest?.some((c: any) => c.user_id === dto.voter_id);
    const updatedAgenda = meeting.agenda?.map((item: any) => {
      if (item.item === dto.agenda_item) {
        return {
          ...item,
          votes: [
            ...(item.votes || []),
            {
              voter_id: dto.voter_id,
              vote: dto.vote,
              comments: dto.comments,
              recorded_at: new Date().toISOString(),
              flagged_coi: hasCoi || false,
            },
          ],
        };
      }
      return item;
    });

    await this.supabase
      .from('meetings')
      .update({ agenda: updatedAgenda })
      .eq('id', meetingId);

    await this.logAudit(user.id, 'meeting.vote_recorded', 'meeting', meetingId, {
      ...dto,
      flagged_coi: hasCoi,
    });
    return { success: true, message: 'Vote recorded', flagged_coi: hasCoi };
  }

  /**
   * Check if a user is eligible to vote (active committee member)
   */
  async isVoterEligible(committeeId: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('committee_members')
      .select('id')
      .eq('committee_id', committeeId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return !!data;
  }

  /**
   * Calculate vote results for an agenda item
   */
  async calculateVoteResults(meetingId: string, agendaItem: string): Promise<{
    agenda_item: string;
    approve: number;
    reject: number;
    abstain: number;
    total_votes: number;
    quorum_met: boolean;
    result: 'approved' | 'rejected' | 'tied' | 'no_quorum';
    flagged_votes: number;
    voters: Array<{ voter_id: string; vote: string; flagged_coi: boolean }>;
  }> {
    const { data: meeting } = await this.supabase
      .from('meetings')
      .select('agenda, quorum_present, committee:committees(quorum_required)')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const committee = meeting.committee as any;
    const item = meeting.agenda?.find((a: any) => a.item === agendaItem);

    if (!item) {
      throw new NotFoundException(`Agenda item "${agendaItem}" not found`);
    }

    const votes = item.votes || [];
    const approve = votes.filter((v: any) => v.vote === 'approve').length;
    const reject = votes.filter((v: any) => v.vote === 'reject').length;
    const abstain = votes.filter((v: any) => v.vote === 'abstain').length;
    const flaggedVotes = votes.filter((v: any) => v.flagged_coi).length;

    const quorumMet = meeting.quorum_present >= committee.quorum_required;
    let result: 'approved' | 'rejected' | 'tied' | 'no_quorum' = 'no_quorum';

    if (quorumMet) {
      if (approve > reject) {
        result = 'approved';
      } else if (reject > approve) {
        result = 'rejected';
      } else {
        result = 'tied';
      }
    }

    return {
      agenda_item: agendaItem,
      approve,
      reject,
      abstain,
      total_votes: votes.length,
      quorum_met: quorumMet,
      result,
      flagged_votes: flaggedVotes,
      voters: votes.map((v: any) => ({
        voter_id: v.voter_id,
        vote: v.vote,
        flagged_coi: v.flagged_coi || false,
      })),
    };
  }

  /**
   * Get all vote results for a meeting
   */
  async getMeetingVoteResults(meetingId: string): Promise<{
    meeting_id: string;
    quorum_present: number;
    quorum_required: number;
    agenda_results: Array<any>;
  }> {
    const { data: meeting } = await this.supabase
      .from('meetings')
      .select('agenda, quorum_present, committee:committees(quorum_required)')
      .eq('id', meetingId)
      .single();

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const committee = meeting.committee as any;
    const agendaResults = [];

    for (const item of (meeting.agenda || [])) {
      if (item.votes && item.votes.length > 0) {
        const result = await this.calculateVoteResults(meetingId, item.item);
        agendaResults.push(result);
      }
    }

    return {
      meeting_id: meetingId,
      quorum_present: meeting.quorum_present,
      quorum_required: committee.quorum_required,
      agenda_results: agendaResults,
    };
  }

  async uploadMinutes(meetingId: string, dto: UploadMinutesDto, user: any) {
    const { data: meeting, error } = await this.supabase
      .from('meetings')
      .update({
        minutes: dto.minutes,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to upload minutes');
    }

    await this.logAudit(user.id, 'meeting.minutes_uploaded', 'meeting', meetingId, { has_document: !!dto.document_url });
    return meeting;
  }

  async approveMinutes(meetingId: string, dto: ApproveMinutesDto, user: any) {
    const { data: meeting, error } = await this.supabase
      .from('meetings')
      .update({
        minutes_approved: true,
        minutes_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to approve minutes');
    }

    await this.logAudit(user.id, 'meeting.minutes_approved', 'meeting', meetingId, dto);
    return meeting;
  }

  // ==================== HELPERS ====================

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, details: any) {
    await this.supabase.from('audit_logs').insert({
      event_type: action.split('.')[0],
      entity_type: entityType,
      entity_id: entityId,
      actor_id: userId,
      action,
      metadata: details,
      created_at: new Date().toISOString(),
    });
  }
}
