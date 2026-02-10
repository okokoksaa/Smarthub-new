import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { WdcService } from './wdc.service';
import { CreateWdcSignoffDto } from './dto/create-wdc-signoff.dto';
import { UpdateWdcSignoffDto } from './dto/update-wdc-signoff.dto';
import { Request } from '@nestjs/common';

@ApiTags('WDC')
@Controller('wdc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WdcController {
  constructor(private readonly wdcService: WdcService) {}

  @Get('signoffs/project/:projectId')
  @ApiOperation({ summary: 'Get WDC sign-off by project' })
  async getByProject(@Param('projectId') projectId: string) {
    return this.wdcService.getSignoffByProject(projectId);
  }

  @Post('signoffs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('wdc_member', 'cdfc_member', 'cdfc_chair', 'plgo')
  @ApiOperation({ summary: 'Create WDC sign-off' })
  @ApiResponse({ status: 201, description: 'WDC sign-off created' })
  async create(@Body() dto: CreateWdcSignoffDto, @Request() req: any) {
    return this.wdcService.createSignoff(dto, req.user);
  }

  @Patch('signoffs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('wdc_member', 'cdfc_member', 'cdfc_chair', 'plgo')
  @ApiOperation({ summary: 'Update WDC sign-off' })
  async update(@Param('id') id: string, @Body() dto: UpdateWdcSignoffDto) {
    return this.wdcService.updateSignoff(id, dto);
  }
}

