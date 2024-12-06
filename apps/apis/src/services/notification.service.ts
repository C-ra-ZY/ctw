import { Injectable } from '@nestjs/common';
import { Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // 使用 Inject 注入 Kafka 客户端
  ) {}

  // 向 Kafka 发送分数更新通知
  async sendScoreUpdateNotification(
    userId: string,
    affectedUsers: { userId: string; rank: number }[],
  ): Promise<void> {
    const message = {
      userId,
      affectedUsers, // 受影响的用户及其最新排名
    };

    affectedUsers.map(async (user) => {
      try {
        await this.kafkaClient.emit('score-update-topic', {
          userId: user.userId,
          rank: user.rank,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send notification for user: ${userId}`,
          error.stack,
        );
      }
    });
  }
}
