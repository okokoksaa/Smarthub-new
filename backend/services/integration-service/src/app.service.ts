import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): string {
    return 'Integration Service is healthy!';
  }

  getBankIntegrations(): string {
    return 'This action returns a list of integrated banks and their status.';
  }
}
