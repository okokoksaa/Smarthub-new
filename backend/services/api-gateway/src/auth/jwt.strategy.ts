import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Load JWK for ES256 verification
    const jwkPath = path.join(__dirname, '../../jwk.json');
    const jwk = JSON.parse(fs.readFileSync(jwkPath, 'utf-8'));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // Use JWK for ES256 verification
        done(null, jwk);
      },
      algorithms: ['ES256'],
      audience: 'authenticated',
      issuer: 'https://bwcqjrsuzvsqnmkznmiy.supabase.co/auth/v1',
    });

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

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Get user roles from database
    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', payload.sub);

    const roles = userRoles?.map(r => r.role) || [];

    return {
      id: payload.sub,
      email: payload.email,
      roles,
    };
  }
}
