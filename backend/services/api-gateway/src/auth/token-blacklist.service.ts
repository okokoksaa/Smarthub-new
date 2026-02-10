import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Token Blacklist Service
 * Manages revoked tokens for secure logout
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private supabase: SupabaseClient;
  private memoryCache: Set<string> = new Set();

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Add token to blacklist
   */
  async blacklistToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    try {
      // Add to memory cache for fast lookup
      const tokenHash = this.hashToken(token);
      this.memoryCache.add(tokenHash);

      // Store in database for persistence
      await this.supabase.from('token_blacklist').insert({
        token_hash: tokenHash,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        blacklisted_at: new Date().toISOString(),
      });

      this.logger.log(`Token blacklisted for user ${userId}`);
    } catch (err) {
      this.logger.error(`Failed to blacklist token: ${err.message}`);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    // Check memory cache first (fast)
    if (this.memoryCache.has(tokenHash)) {
      return true;
    }

    // Check database (slower but persistent)
    try {
      const { data, error } = await this.supabase
        .from('token_blacklist')
        .select('id')
        .eq('token_hash', tokenHash)
        .single();

      if (data && !error) {
        // Add to memory cache for future lookups
        this.memoryCache.add(tokenHash);
        return true;
      }
    } catch {
      // Token not found in blacklist
    }

    return false;
  }

  /**
   * Revoke all tokens for a user (e.g., password change, security breach)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Sign out user from Supabase (invalidates all sessions)
      await this.supabase.auth.admin.signOut(userId);

      this.logger.log(`All tokens revoked for user ${userId}`);
    } catch (err) {
      this.logger.error(`Failed to revoke user tokens: ${err.message}`);
    }
  }

  /**
   * Clean up expired tokens from blacklist
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('token_blacklist')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (!error) {
        this.logger.log('Expired tokens cleaned up');
      }
    } catch (err) {
      this.logger.error(`Cleanup error: ${err.message}`);
    }
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    // Use last 32 characters of token as hash (JWT signature)
    // This is sufficient for uniqueness and doesn't store the full token
    return token.slice(-32);
  }
}
