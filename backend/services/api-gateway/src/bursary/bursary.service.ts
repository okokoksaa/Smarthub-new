import { Injectable } from '@nestjs/common';
import { CreateBursaryDto } from './dto/create-bursary.dto';
import { UpdateBursaryDto } from './dto/update-bursary.dto';

@Injectable()
export class BursaryService {
  create(createBursaryDto: CreateBursaryDto) {
    return 'This action adds a new bursary application';
  }

  findAll() {
    return `This action returns all bursary applications`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bursary application`;
  }

  update(id: number, updateBursaryDto: UpdateBursaryDto) {
    return `This action updates a #${id} bursary application`;
  }

  remove(id: number) {
    return `This action removes a #${id} bursary application`;
  }
}
