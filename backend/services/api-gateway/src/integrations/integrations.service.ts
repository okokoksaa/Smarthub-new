import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type ImportArgs = {
  file: { buffer: Buffer; originalname: string };
  bankName: string;
  accountNumber: string;
  start?: string;
  end?: string;
  user?: any;
};

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
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

  async importBankCsv(args: ImportArgs) {
    const { file, bankName, accountNumber, start, end, user } = args;
    if (!file || !file.buffer) throw new BadRequestException('CSV file is required');
    const text = file.buffer.toString('utf8');
    const rows = this.parseCsv(text);
    if (rows.length === 0) throw new BadRequestException('Empty CSV');

    const header = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const idx = {
      date: this.findHeader(header, ['date', 'txn date', 'transaction date']),
      description: this.findHeader(header, ['description', 'details', 'narration']),
      reference: this.findHeader(header, ['reference', 'ref', 'transaction id']),
      debit: this.findHeader(header, ['debit', 'withdrawal', 'dr']),
      credit: this.findHeader(header, ['credit', 'deposit', 'cr']),
      balance: this.findHeader(header, ['balance', 'running balance']),
      amount: this.findHeader(header, ['amount']),
    };

    const parsed = dataRows
      .filter((cols) => cols.some((c) => c && c.trim().length > 0))
      .map((cols) => {
        const dStr = idx.date !== -1 ? cols[idx.date] : undefined;
        const desc = idx.description !== -1 ? cols[idx.description] : undefined;
        const ref = idx.reference !== -1 ? cols[idx.reference] : undefined;
        const debitStr = idx.debit !== -1 ? cols[idx.debit] : undefined;
        const creditStr = idx.credit !== -1 ? cols[idx.credit] : undefined;
        const balanceStr = idx.balance !== -1 ? cols[idx.balance] : undefined;
        const amountStr = idx.amount !== -1 ? cols[idx.amount] : undefined;

        const debit = amountStr ? (Number(amountStr) < 0 ? Math.abs(Number(amountStr)) : undefined) : this.toNumber(debitStr);
        const credit = amountStr ? (Number(amountStr) > 0 ? Number(amountStr) : undefined) : this.toNumber(creditStr);
        const balance = this.toNumber(balanceStr);
        const txnDate = this.toDateISO(dStr);

        return {
          txn_date: txnDate,
          description: desc,
          reference: ref,
          debit,
          credit,
          balance,
          raw: this.toRaw(cols, header),
        };
      })
      .filter((r) => r.txn_date);

    // Create import record
    const { data: importRec, error: importErr } = await this.supabase
      .from('bank_imports')
      .insert({
        bank_name: bankName,
        account_number: accountNumber,
        statement_period_start: start || null,
        statement_period_end: end || null,
        file_name: file.originalname,
        imported_by: user?.id || null,
      })
      .select()
      .single();

    if (importErr) {
      this.logger.error('Failed to create bank import', importErr);
      throw new BadRequestException('Failed to create bank import');
    }

    // Chunk inserts
    const chunks: any[] = [];
    const CHUNK_SIZE = 500;
    for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
      const slice = parsed.slice(i, i + CHUNK_SIZE).map((p) => ({ ...p, import_id: importRec.id }));
      chunks.push(slice);
    }

    for (const chunk of chunks) {
      const { error } = await this.supabase.from('bank_transactions').insert(chunk);
      if (error) {
        this.logger.error('Failed to insert bank transactions', error);
        throw new BadRequestException('Failed to insert bank transactions');
      }
    }

    return { message: 'Import successful', import_id: importRec.id, inserted: parsed.length };
  }

  async listBankImports(page = 1, limit = 20) {
    const { data, error, count } = await this.supabase
      .from('bank_imports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw new BadRequestException('Failed to list bank imports');
    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  // =============== Helpers ===============
  private findHeader(header: string[], candidates: string[]): number {
    for (const c of candidates) {
      const idx = header.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  private toNumber(v?: string) {
    if (!v) return undefined;
    const cleaned = v.replace(/[,\s]/g, '');
    if (cleaned === '') return undefined;
    const n = Number(cleaned);
    return isNaN(n) ? undefined : n;
  }

  private toDateISO(v?: string) {
    if (!v) return undefined;
    // Try common formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
    const t = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const dmy = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    const mdy = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  }

  private toRaw(cols: string[], header: string[]) {
    const obj: Record<string, any> = {};
    header.forEach((h, i) => (obj[h] = cols[i]));
    return obj;
  }

  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          current.push(field);
          field = '';
        } else if (char === '\n') {
          current.push(field);
          rows.push(current);
          current = [];
          field = '';
        } else if (char === '\r') {
          // ignore CR
        } else {
          field += char;
        }
      }
    }
    // last field
    if (field.length > 0 || current.length > 0) {
      current.push(field);
      rows.push(current);
    }
    // trim whitespace of all cells
    return rows.map((r) => r.map((c) => (c ?? '').trim()))
      .filter((r) => r.length > 0);
  }
}
