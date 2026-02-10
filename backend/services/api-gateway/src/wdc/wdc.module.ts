import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WdcController } from './wdc.controller';
import { WdcService } from './wdc.service';

@Module({
  imports: [ConfigModule],
  controllers: [WdcController],
  providers: [WdcService],
})
export class WdcModule {}

