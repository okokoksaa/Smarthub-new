import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateWdcSignoffDto } from './dto/create-wdc-signoff.dto';
import { UpdateWdcSignoffDto } from './dto/update-wdc-signoff.dto';

@Injectable()
export class WdcService {
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

  async getSignoffByProject(projectId: string) {
    const { data, error } = await this.supabase
      .from('wdc_signoffs')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException('Failed to fetch WDC sign-off');
    }

    if (!data) {
      throw new NotFoundException('WDC sign-off not found for project');
    }

    return data;
  }

  async createSignoff(dto: CreateWdcSignoffDto, user: any) {
    // Ensure one sign-off per project
    const { data: existing } = await this.supabase
      .from('wdc_signoffs')
      .select('id')
      .eq('project_id', dto.project_id)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException('WDC sign-off already exists for this project');
    }

    const payload: any = {
      ...dto,
      created_by: user.id,
      chair_signed_at: dto.chair_signed ? new Date().toISOString() : null,
    };

    const { data, error } = await this.supabase
      .from('wdc_signoffs')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException('Failed to create WDC sign-off');
    }

    return data;
  }

  async updateSignoff(id: string, dto: UpdateWdcSignoffDto) {
    // Fetch existing to compute transitions
    const { data: existing, error: findErr } = await this.supabase
      .from('wdc_signoffs')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      throw new NotFoundException('WDC sign-off not found');
    }

    const update: any = { ...dto };

    if (dto.chair_signed && !existing.chair_signed) {
      update.chair_signed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('wdc_signoffs')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new BadRequestException('Failed to update WDC sign-off');
    }

    return data;
  }
}

