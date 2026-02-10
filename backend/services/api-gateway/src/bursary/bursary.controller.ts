import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BursaryService } from './bursary.service';
import { CreateBursaryDto } from './dto/create-bursary.dto';
import { UpdateBursaryDto } from './dto/update-bursary.dto';

@Controller('bursary')
export class BursaryController {
  constructor(private readonly bursaryService: BursaryService) {}

  @Post()
  create(@Body() createBursaryDto: CreateBursaryDto) {
    return this.bursaryService.create(createBursaryDto);
  }

  @Get()
  findAll() {
    return this.bursaryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bursaryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBursaryDto: UpdateBursaryDto) {
    return this.bursaryService.update(+id, updateBursaryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bursaryService.remove(+id);
  }
}
