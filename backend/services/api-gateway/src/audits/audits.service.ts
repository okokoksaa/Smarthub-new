import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScopeContext } from '../common/scope/scope-context';
import { applyScopeToRows } from '../common/scope/scope.utils';

type RedFlagsParams = {
  startDate?: string;
  endDate?: string;
  constituencyId?: string;
  minLargeAmount?: number;
  scopeContext?: ScopeContext;
};

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    this.supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  async getRedFlags(params: RedFlagsParams) {
    const start = params.startDate || '1900-01-01';
    const end = params.endDate || '2999-12-31';
    const largeThreshold = params.minLargeAmount ?? 1_000_000;

    // Fetch payments in range
    let pQuery = this.supabase
      .from('payments')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);
    if (params.constituencyId) pQuery = pQuery.eq('constituency_id', params.constituencyId);
    const { data: payments, error: pErr } = await pQuery;
    if (pErr) throw new BadRequestException('Failed to load payments');

    const scopedPayments = applyScopeToRows(payments || [], params.scopeContext);

    const flags = {
      summary: {
        total_payments: scopedPayments.length || 0,
      },
      same_user_both_panels: [] as any[],
      panel_sequence_violation: [] as any[],
      disbursement_without_approvals: [] as any[],
      duplicate_transaction_reference: [] as any[],
      large_payments: [] as any[],
      fast_approvals: [] as any[],
    };

    const refMap: Record<string, string[]> = {};

    for (const pay of scopedPayments) {
      // Duplicate reference
      const ref = pay.transaction_reference?.trim();
      if (ref) {
        if (!refMap[ref]) refMap[ref] = [];
        refMap[ref].push(pay.id);
      }

      // Same user approving both panels
      if (pay.panel_a_approved_by && pay.panel_b_approved_by && pay.panel_a_approved_by === pay.panel_b_approved_by) {
        flags.same_user_both_panels.push({ payment_id: pay.id, user_id: pay.panel_a_approved_by });
      }

      // Panel sequence violation
      if (pay.panel_b_approved_at && (!pay.panel_a_approved_at || new Date(pay.panel_b_approved_at) < new Date(pay.panel_a_approved_at))) {
        flags.panel_sequence_violation.push({ payment_id: pay.id, panel_a_approved_at: pay.panel_a_approved_at, panel_b_approved_at: pay.panel_b_approved_at });
      }

      // Disbursement without approvals or before approvals timestamps
      if (pay.disbursed_at) {
        const missingApprovals = !(pay.panel_a_approved_at && pay.panel_b_approved_at);
        const outOfOrder = pay.panel_b_approved_at && new Date(pay.disbursed_at) < new Date(pay.panel_b_approved_at);
        if (missingApprovals || outOfOrder) {
          flags.disbursement_without_approvals.push({ payment_id: pay.id, disbursed_at: pay.disbursed_at, panel_a_approved_at: pay.panel_a_approved_at, panel_b_approved_at: pay.panel_b_approved_at });
        }
      }

      // Large payments
      if ((pay.amount || 0) >= largeThreshold) {
        flags.large_payments.push({ payment_id: pay.id, amount: pay.amount });
      }

      // Fast approvals (Panel A approved within < 60 seconds of creation)
      if (pay.panel_a_approved_at && pay.created_at) {
        const seconds = (new Date(pay.panel_a_approved_at).getTime() - new Date(pay.created_at).getTime()) / 1000;
        if (seconds >= 0 && seconds < 60) {
          flags.fast_approvals.push({ payment_id: pay.id, seconds_to_panel_a: Math.round(seconds) });
        }
      }
    }

    // Build duplicate reference flags
    for (const [reference, ids] of Object.entries(refMap)) {
      if (ids.length > 1) {
        flags.duplicate_transaction_reference.push({ reference, payment_ids: ids });
      }
    }

    flags.summary = {
      ...flags.summary,
      same_user_both_panels: flags.same_user_both_panels.length,
      panel_sequence_violation: flags.panel_sequence_violation.length,
      disbursement_without_approvals: flags.disbursement_without_approvals.length,
      duplicate_transaction_reference: flags.duplicate_transaction_reference.length,
      large_payments: flags.large_payments.length,
      fast_approvals: flags.fast_approvals.length,
    } as any;

    return flags;
  }
}

