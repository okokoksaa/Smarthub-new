import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AdvisoryService } from './advisory.service';

@Controller('advisory')
export class AdvisoryController {
  constructor(private readonly advisoryService: AdvisoryService) {}

  /**
   * Get dashboard insights for a constituency
   * GET /advisory/insights/:constituencyId
   */
  @Get('insights/:constituencyId')
  async getDashboardInsights(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
  ) {
    const insights = await this.advisoryService.generateDashboardInsights(constituencyId);

    return {
      success: true,
      data: insights,
    };
  }
}
