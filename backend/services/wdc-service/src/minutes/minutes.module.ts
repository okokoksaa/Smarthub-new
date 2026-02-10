import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinutesController } from './minutes.controller';
import { MinutesService } from './minutes.service';
import { WdcMinutes } from './entities/minutes.entity';

/**
 * Minutes Module
 * Handles WDC meeting minutes management
 */
@Module({
  imports: [TypeOrmModule.forFeature([WdcMinutes])],
  controllers: [MinutesController],
  providers: [MinutesService],
  exports: [MinutesService],
})
export class MinutesModule {}