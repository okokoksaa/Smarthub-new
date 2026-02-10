import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AuditsController],
  providers: [AuditsService],
})
export class AuditsModule {}

