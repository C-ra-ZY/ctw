import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('health')
  @HttpCode(200)
  health(): string {
    return `Alive at ${new Date().toISOString()}`;
  }
}
