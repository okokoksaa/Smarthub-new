import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PaymentsModule } from './payments/payments.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuditsModule } from './audits/audits.module';
import { ProjectsModule } from './projects/projects.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CommitteesModule } from './committees/committees.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { WdcModule } from './wdc/wdc.module';
import { GeographyModule } from './geography/geography.module';
import { CalendarModule } from './calendar/calendar.module';
import { ProcurementModule } from './procurement/procurement.module';
import { BursariesModule } from './bursaries/bursaries.module';
import { EmpowermentModule } from './empowerment/empowerment.module';
import { PublicModule } from './public/public.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { MinistryModule } from './ministry/ministry.module';
import { LegalModule } from './legal/legal.module';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * API Gateway Main Module
 *
 * CDF Smart Hub - Constituency Development Fund Management System
 * Modules:
 * - Auth: JWT authentication and role-based access control
 * - Payments: Two-Panel Authorization for payment approvals
 * - Projects: Project lifecycle management with approval workflow
 * - Budgets: Budget allocation and tracking
 * - Committees: CDFC/TAC/WDC committee and meeting management
 * - Documents: Document management with immutability and verification
 * - Reports: Analytics and reporting across all modules
 * - WDC: Ward Development Committee sign-off management
 * - Geography: Province, district, constituency, ward data
 * - Calendar: Public holidays and working-days SLA calculations
 */
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env.local', '../../.env'],
    }),

    // Rate limiting (throttling)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes default
            limit: configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100), // 100 requests default
          },
        ],
      }),
    }),

    // Feature modules
    AuthModule,
    PaymentsModule,
    IntegrationsModule,
    AuditsModule,
    ProjectsModule,
    BudgetsModule,
    CommitteesModule,
    DocumentsModule,
    ReportsModule,
    WdcModule,
    GeographyModule,
    CalendarModule,
    ProcurementModule,
    BursariesModule,
    EmpowermentModule,
    PublicModule,
    MonitoringModule,
    MinistryModule,
    LegalModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global authentication guard - validates Supabase tokens
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    // Global roles guard - checks role requirements
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
