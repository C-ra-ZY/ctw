import { Module } from '@nestjs/common';
import { RedisModule } from './redis.module';
import { ScoreModule } from './score.module';
import { NotificationModule } from './notification.module';
import { HealthModule } from './health.module';

@Module({
  imports: [RedisModule, ScoreModule, NotificationModule, HealthModule],
})
export class AppModule {}
