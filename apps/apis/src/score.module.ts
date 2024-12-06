import { Module } from '@nestjs/common';
import { RedisModule } from './redis.module';
import { ScoreService } from './services/score.service';
import { ScoreController } from './controllers/score.controller';
import { AuditService } from './services/audit.service';
import { NotificationModule } from './notification.module';

@Module({
  imports: [RedisModule, NotificationModule],
  providers: [ScoreService, AuditService],
  controllers: [ScoreController],
})
export class ScoreModule {}
