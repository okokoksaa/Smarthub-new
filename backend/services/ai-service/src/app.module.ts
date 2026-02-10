import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RiskModule } from './risk/risk.module';
import { AdvisoryModule } from './advisory/advisory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RiskModule,
    AdvisoryModule,
  ],
})
export class AppModule {}
