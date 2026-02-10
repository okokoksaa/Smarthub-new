import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Province {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  province_id: string;
  province?: Province;
  created_at?: string;
}

export interface Constituency {
  id: string;
  name: string;
  code: string;
  district_id: string;
  district?: District;
  total_budget?: number;
  allocated_budget?: number;
  disbursed_budget?: number;
  created_at?: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  constituency_id: string;
  constituency?: Constituency;
  created_at?: string;
}

@Injectable()
export class GeographyService {
  private readonly logger = new Logger(GeographyService.name);
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

  // ==================== PROVINCES ====================

  async findAllProvinces(): Promise<Province[]> {
    const { data, error } = await this.supabase
      .from('provinces')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch provinces', error);
      throw new BadRequestException('Failed to fetch provinces');
    }

    return data || [];
  }

  async findProvinceById(id: string): Promise<Province> {
    const { data, error } = await this.supabase
      .from('provinces')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Province not found: ${id}`);
    }

    return data;
  }

  // ==================== DISTRICTS ====================

  async findAllDistricts(provinceId?: string): Promise<District[]> {
    let query = this.supabase
      .from('districts')
      .select(`
        *,
        province:provinces(id, name, code)
      `)
      .order('name', { ascending: true });

    if (provinceId) {
      query = query.eq('province_id', provinceId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch districts', error);
      throw new BadRequestException('Failed to fetch districts');
    }

    return data || [];
  }

  async findDistrictById(id: string): Promise<District> {
    const { data, error } = await this.supabase
      .from('districts')
      .select(`
        *,
        province:provinces(id, name, code)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`District not found: ${id}`);
    }

    return data;
  }

  // ==================== CONSTITUENCIES ====================

  async findAllConstituencies(districtId?: string): Promise<Constituency[]> {
    let query = this.supabase
      .from('constituencies')
      .select(`
        *,
        district:districts(
          id, name, code,
          province:provinces(id, name, code)
        )
      `)
      .order('name', { ascending: true });

    if (districtId) {
      query = query.eq('district_id', districtId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch constituencies', error);
      throw new BadRequestException('Failed to fetch constituencies');
    }

    return data || [];
  }

  async findConstituencyById(id: string): Promise<Constituency> {
    const { data, error } = await this.supabase
      .from('constituencies')
      .select(`
        *,
        district:districts(
          id, name, code,
          province:provinces(id, name, code)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Constituency not found: ${id}`);
    }

    return data;
  }

  // ==================== WARDS ====================

  async findAllWards(constituencyId?: string): Promise<Ward[]> {
    let query = this.supabase
      .from('wards')
      .select(`
        *,
        constituency:constituencies(
          id, name, code,
          district:districts(
            id, name, code,
            province:provinces(id, name, code)
          )
        )
      `)
      .order('name', { ascending: true });

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch wards', error);
      throw new BadRequestException('Failed to fetch wards');
    }

    return data || [];
  }

  async findWardById(id: string): Promise<Ward> {
    const { data, error } = await this.supabase
      .from('wards')
      .select(`
        *,
        constituency:constituencies(
          id, name, code,
          district:districts(
            id, name, code,
            province:provinces(id, name, code)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ward not found: ${id}`);
    }

    return data;
  }

  // ==================== HIERARCHY HELPERS ====================

  /**
   * Get full hierarchy: Province -> District -> Constituency -> Ward
   */
  async getHierarchy(): Promise<{
    provinces: Array<Province & { districts: Array<District & { constituencies: Constituency[] }> }>;
  }> {
    const { data: provinces, error: provError } = await this.supabase
      .from('provinces')
      .select('*')
      .order('name');

    if (provError) {
      throw new BadRequestException('Failed to fetch hierarchy');
    }

    const { data: districts, error: distError } = await this.supabase
      .from('districts')
      .select('*')
      .order('name');

    if (distError) {
      throw new BadRequestException('Failed to fetch hierarchy');
    }

    const { data: constituencies, error: constError } = await this.supabase
      .from('constituencies')
      .select('*')
      .order('name');

    if (constError) {
      throw new BadRequestException('Failed to fetch hierarchy');
    }

    // Build hierarchy
    const hierarchy = (provinces || []).map((province) => ({
      ...province,
      districts: (districts || [])
        .filter((d) => d.province_id === province.id)
        .map((district) => ({
          ...district,
          constituencies: (constituencies || []).filter(
            (c) => c.district_id === district.id,
          ),
        })),
    }));

    return { provinces: hierarchy };
  }

  /**
   * Get statistics for each level
   */
  async getStatistics(): Promise<{
    provinces: number;
    districts: number;
    constituencies: number;
    wards: number;
  }> {
    const [provincesRes, districtsRes, constituenciesRes, wardsRes] = await Promise.all([
      this.supabase.from('provinces').select('id', { count: 'exact', head: true }),
      this.supabase.from('districts').select('id', { count: 'exact', head: true }),
      this.supabase.from('constituencies').select('id', { count: 'exact', head: true }),
      this.supabase.from('wards').select('id', { count: 'exact', head: true }),
    ]);

    return {
      provinces: provincesRes.count || 0,
      districts: districtsRes.count || 0,
      constituencies: constituenciesRes.count || 0,
      wards: wardsRes.count || 0,
    };
  }
}
