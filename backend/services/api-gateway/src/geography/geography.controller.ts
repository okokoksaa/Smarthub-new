import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Geography')
@Controller('geography')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  // ==================== PROVINCES ====================

  @Get('provinces')
  @ApiOperation({ summary: 'List all provinces' })
  async findAllProvinces() {
    const data = await this.geographyService.findAllProvinces();
    return { data };
  }

  @Get('provinces/:id')
  @ApiOperation({ summary: 'Get province by ID' })
  @ApiParam({ name: 'id', description: 'Province UUID' })
  async findProvinceById(@Param('id') id: string) {
    const data = await this.geographyService.findProvinceById(id);
    return { data };
  }

  // ==================== DISTRICTS ====================

  @Get('districts')
  @ApiOperation({ summary: 'List all districts, optionally filtered by province' })
  @ApiQuery({ name: 'province_id', required: false, description: 'Filter by province UUID' })
  async findAllDistricts(@Query('province_id') provinceId?: string) {
    const data = await this.geographyService.findAllDistricts(provinceId);
    return { data };
  }

  @Get('districts/:id')
  @ApiOperation({ summary: 'Get district by ID' })
  @ApiParam({ name: 'id', description: 'District UUID' })
  async findDistrictById(@Param('id') id: string) {
    const data = await this.geographyService.findDistrictById(id);
    return { data };
  }

  // ==================== CONSTITUENCIES ====================

  @Get('constituencies')
  @ApiOperation({ summary: 'List all constituencies, optionally filtered by district' })
  @ApiQuery({ name: 'district_id', required: false, description: 'Filter by district UUID' })
  async findAllConstituencies(@Query('district_id') districtId?: string) {
    const data = await this.geographyService.findAllConstituencies(districtId);
    return { data };
  }

  @Get('constituencies/:id')
  @ApiOperation({ summary: 'Get constituency by ID' })
  @ApiParam({ name: 'id', description: 'Constituency UUID' })
  async findConstituencyById(@Param('id') id: string) {
    const data = await this.geographyService.findConstituencyById(id);
    return { data };
  }

  // ==================== WARDS ====================

  @Get('wards')
  @ApiOperation({ summary: 'List all wards, optionally filtered by constituency' })
  @ApiQuery({ name: 'constituency_id', required: false, description: 'Filter by constituency UUID' })
  async findAllWards(@Query('constituency_id') constituencyId?: string) {
    const data = await this.geographyService.findAllWards(constituencyId);
    return { data };
  }

  @Get('wards/:id')
  @ApiOperation({ summary: 'Get ward by ID' })
  @ApiParam({ name: 'id', description: 'Ward UUID' })
  async findWardById(@Param('id') id: string) {
    const data = await this.geographyService.findWardById(id);
    return { data };
  }

  // ==================== UTILITIES ====================

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get full geographic hierarchy (Province -> District -> Constituency)' })
  async getHierarchy() {
    const data = await this.geographyService.getHierarchy();
    return { data };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get geographic statistics (counts at each level)' })
  async getStatistics() {
    const data = await this.geographyService.getStatistics();
    return { data };
  }
}
