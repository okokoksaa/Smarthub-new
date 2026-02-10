import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { SubmitBidDto } from './dto/submit-bid.dto';
import { OpenBidsDto } from './dto/open-bids.dto';

@Injectable()
export class SealedBidsService {
  private readonly logger = new Logger(SealedBidsService.name);
  private supabase: SupabaseClient;

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

  async submitBid(procurementId: string, submitBidDto: SubmitBidDto, user: any) {
    this.logger.log(`Contractor ${user.id} submitting bid for procurement ${procurementId}`);

    // 1. Get procurement details
    const { data: procurement, error: procError } = await this.supabase
      .from('procurements')
      .select('id, status, closing_date, bid_opening_date, constituency_id')
      .eq('id', procurementId)
      .single();

    if (procError || !procurement) {
      throw new NotFoundException('Procurement not found');
    }

    // 2. Validate procurement is published and accepting bids
    if (procurement.status !== 'published') {
      throw new BadRequestException('This procurement is not accepting bids');
    }

    // 3. Validate bidding period is open
    const now = new Date();
    if (procurement.closing_date && new Date(procurement.closing_date) < now) {
      throw new BadRequestException('Bidding period has closed');
    }

    // 4. Get contractor ID for this user
    const { data: contractor, error: contractorError } = await this.supabase
      .from('contractors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (contractorError || !contractor) {
      throw new ForbiddenException('User is not registered as a contractor');
    }

    // 5. Check if contractor already submitted a bid
    const { data: existingBid } = await this.supabase
      .from('procurement_bids')
      .select('id')
      .eq('procurement_id', procurementId)
      .eq('contractor_id', contractor.id)
      .single();

    if (existingBid) {
      throw new BadRequestException('You have already submitted a bid for this procurement');
    }

    // 6. Encrypt bid data (sealed bid mechanism)
    const encryptedBidData = this.encryptBidData({
      bid_amount: submitBidDto.bid_amount,
      technical_proposal_summary: submitBidDto.technical_proposal_summary,
      delivery_timeline_days: submitBidDto.delivery_timeline_days,
      warranty_period_months: submitBidDto.warranty_period_months,
      submitted_at: now.toISOString(),
    });

    // 7. Create bid record
    const { data: bid, error: bidError } = await this.supabase
      .from('procurement_bids')
      .insert({
        procurement_id: procurementId,
        contractor_id: contractor.id,
        bid_amount: null, // NULL until opened - sealed bid
        encrypted_bid_data: encryptedBidData,
        bid_document_hash: submitBidDto.bid_document_hash,
        bid_document_id: submitBidDto.bid_document_id,
        technical_proposal_summary: null, // NULL until opened
        delivery_timeline_days: null, // NULL until opened
        warranty_period_months: null, // NULL until opened
        status: 'submitted',
        submitted_at: now.toISOString(),
        submitted_by: user.id,
      })
      .select()
      .single();

    if (bidError) {
      this.logger.error('Failed to submit bid', bidError);
      throw new BadRequestException('Failed to submit bid');
    }

    // 8. Log audit event
    await this.logAuditEvent(
      procurementId,
      bid.id,
      'bid_submitted',
      'Sealed bid submitted',
      user.id,
      { contractor_id: contractor.id, document_hash: submitBidDto.bid_document_hash }
    );

    // Return confirmation without revealing bid details
    return {
      id: bid.id,
      procurement_id: procurementId,
      status: bid.status,
      submitted_at: bid.submitted_at,
      message: 'Bid submitted successfully. Details will be revealed at bid opening.',
    };
  }

  async getBids(procurementId: string, user: any) {
    // 1. Get procurement to check if bids are opened
    const { data: procurement } = await this.supabase
      .from('procurements')
      .select('status, bid_opening_date')
      .eq('id', procurementId)
      .single();

    if (!procurement) {
      throw new NotFoundException('Procurement not found');
    }

    // 2. Check if bids have been opened
    const bidsOpened = procurement.status === 'evaluation' ||
                       procurement.status === 'awarded' ||
                       procurement.status === 'contracted' ||
                       procurement.status === 'completed';

    let query = this.supabase
      .from('procurement_bids')
      .select(`
        id,
        procurement_id,
        contractor:contractors(id, company_name, registration_number),
        status,
        submitted_at,
        ${bidsOpened ? 'bid_amount, technical_proposal_summary, delivery_timeline_days, warranty_period_months, opened_at, decrypted_data,' : ''}
        bid_document_hash
      `)
      .eq('procurement_id', procurementId)
      .order('submitted_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch bids', error);
      throw new BadRequestException('Failed to fetch bids');
    }

    return {
      bids: data,
      bids_opened: bidsOpened,
      message: bidsOpened
        ? 'Bids have been opened and details are visible'
        : 'Bids are sealed and will be opened on the bid opening date',
    };
  }

  async openBids(procurementId: string, openBidsDto: OpenBidsDto, user: any) {
    this.logger.log(`User ${user.id} opening bids for procurement ${procurementId}`);

    // 1. Get procurement
    const { data: procurement, error: procError } = await this.supabase
      .from('procurements')
      .select('id, status, bid_opening_date')
      .eq('id', procurementId)
      .single();

    if (procError || !procurement) {
      throw new NotFoundException('Procurement not found');
    }

    // 2. Validate procurement status
    if (procurement.status !== 'published' && procurement.status !== 'bid_opening') {
      throw new BadRequestException(`Cannot open bids in status: ${procurement.status}`);
    }

    // 3. Validate bid opening date
    const now = new Date();
    const openingDate = new Date(procurement.bid_opening_date);

    if (now < openingDate) {
      throw new BadRequestException(
        `Bids cannot be opened before the bid opening date: ${procurement.bid_opening_date}`
      );
    }

    // 4. Get all submitted bids
    const { data: bids, error: bidsError } = await this.supabase
      .from('procurement_bids')
      .select('id, encrypted_bid_data')
      .eq('procurement_id', procurementId)
      .eq('status', 'submitted');

    if (bidsError) {
      throw new BadRequestException('Failed to fetch bids');
    }

    if (!bids || bids.length === 0) {
      throw new BadRequestException('No bids to open');
    }

    // 5. Decrypt and update each bid
    const openedBids = [];
    for (const bid of bids) {
      try {
        const decryptedData = this.decryptBidData(bid.encrypted_bid_data);

        const { data: updatedBid, error: updateError } = await this.supabase
          .from('procurement_bids')
          .update({
            bid_amount: decryptedData.bid_amount,
            technical_proposal_summary: decryptedData.technical_proposal_summary,
            delivery_timeline_days: decryptedData.delivery_timeline_days,
            warranty_period_months: decryptedData.warranty_period_months,
            decrypted_data: decryptedData,
            opened_at: now.toISOString(),
            opened_by: user.id,
            status: 'valid',
            updated_at: now.toISOString(),
          })
          .eq('id', bid.id)
          .select(`
            id,
            bid_amount,
            contractor:contractors(id, company_name),
            status
          `)
          .single();

        if (updateError) {
          this.logger.error(`Failed to open bid ${bid.id}`, updateError);
        } else {
          openedBids.push(updatedBid);
        }

        // Log individual bid opening
        await this.logAuditEvent(
          procurementId,
          bid.id,
          'bid_opened',
          'Sealed bid opened and decrypted',
          user.id,
          { bid_amount: decryptedData.bid_amount }
        );
      } catch (decryptError) {
        this.logger.error(`Failed to decrypt bid ${bid.id}`, decryptError);

        // Mark bid as invalid due to decryption failure
        await this.supabase
          .from('procurement_bids')
          .update({
            status: 'invalid',
            disqualification_reason: 'Failed to decrypt bid data',
            opened_at: now.toISOString(),
            opened_by: user.id,
          })
          .eq('id', bid.id);
      }
    }

    // 6. Update procurement status to evaluation
    await this.supabase
      .from('procurements')
      .update({
        status: 'evaluation',
        updated_at: now.toISOString(),
      })
      .eq('id', procurementId);

    // 7. Log bid opening ceremony
    await this.logAuditEvent(
      procurementId,
      null,
      'bids_opening_ceremony',
      'All bids opened in official ceremony',
      user.id,
      {
        total_bids: bids.length,
        valid_bids: openedBids.length,
        witnesses: openBidsDto.witnesses,
        opening_notes: openBidsDto.opening_notes,
        meeting_id: openBidsDto.meeting_id,
      }
    );

    return {
      procurement_id: procurementId,
      status: 'evaluation',
      bids_opened: openedBids.length,
      total_bids: bids.length,
      opened_bids: openedBids,
      opened_at: now.toISOString(),
      opened_by: user.id,
      message: `Successfully opened ${openedBids.length} of ${bids.length} bids. Procurement is now in evaluation phase.`,
    };
  }

  // ========== Encryption Helpers ==========

  private encryptBidData(data: any): Buffer {
    // Get encryption key from config or generate deterministic one
    const encryptionKey = this.configService.get<string>('BID_ENCRYPTION_KEY') ||
      crypto.scryptSync('cdf-smart-hub-sealed-bids', 'salt', 32);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);

    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV to encrypted data
    return Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
  }

  private decryptBidData(encryptedData: Buffer): any {
    const encryptionKey = this.configService.get<string>('BID_ENCRYPTION_KEY') ||
      crypto.scryptSync('cdf-smart-hub-sealed-bids', 'salt', 32);

    // Extract IV from beginning of data
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  private async logAuditEvent(
    procurementId: string,
    bidId: string | null,
    eventType: string,
    description: string,
    actorId: string,
    eventData: any = {}
  ) {
    // Get actor role
    const { data: userRole } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', actorId)
      .limit(1)
      .single();

    // Generate event hash for tamper detection
    const eventHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ procurementId, bidId, eventType, actorId, eventData, timestamp: new Date().toISOString() }))
      .digest('hex');

    await this.supabase.from('procurement_audit_events').insert({
      procurement_id: procurementId,
      bid_id: bidId,
      event_type: eventType,
      event_description: description,
      actor_id: actorId,
      actor_role: userRole?.role,
      event_data: eventData,
      event_hash: eventHash,
    });
  }
}
