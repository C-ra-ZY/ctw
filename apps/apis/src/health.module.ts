import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [HealthController],
})
export class HealthModule {}
