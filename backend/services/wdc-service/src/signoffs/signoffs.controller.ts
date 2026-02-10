import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

class CreateWdcSignoffDto {
  project_id!: string;
  chair_signed!: boolean;
}

class UpdateWdcSignoffDto {
  chair_signed?: boolean;
}

@ApiTags('WDC Signoffs')
@Controller('wdc/signoffs')
export class SignoffsController {
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get WDC sign-off by project' })
  async getByProject(@Param('projectId') projectId: string) {
    // Delegated to API Gateway (Supabase). Stub provided for route alignment.
    return { message: 'Handled by API Gateway', projectId };
  }

  @Post()
  @ApiOperation({ summary: 'Create WDC sign-off' })
  @ApiResponse({ status: 201, description: 'WDC sign-off created' })
  async create(@Body() dto: CreateWdcSignoffDto) {
    return { message: 'Handled by API Gateway', dto };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update WDC sign-off' })
  async update(@Param('id') id: string, @Body() dto: UpdateWdcSignoffDto) {
    return { message: 'Handled by API Gateway', id, dto };
  }
}

