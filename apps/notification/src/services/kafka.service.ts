import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';

import { NotificatoinWebSocketGateway } from '../gateway/websocket.gateway';

@Injectable()
export class KafkaService {
  private;
  constructor(
    private readonly websocketGateway: NotificatoinWebSocketGateway,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka, // 使用 Inject 注入 Kafka 客户端
  ) {}

  onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('user_score_updates');
    this.kafkaClient.connect();
  }

  // Kafka 消息处理，转发给 WebSocket 客户端
  @MessagePattern('user_score_updates') // 订阅 Kafka 消息主题
  async handleUserScoreUpdate(@Payload() message: any) {
    const { userId, updatedScore } = JSON.parse(message.value);
    console.log(`Received score update for user ${userId}: ${updatedScore}`);
    // 将 Kafka 消息转发给 WebSocket 客户端
    this.websocketGateway.sendMessageToUser(
      userId,
      `Your score has been updated to ${updatedScore}`,
    );
  }

  // 发布消息到 Kafka
  async sendMessageToKafka(topic: string, message: any) {
    await this.kafkaClient.emit(topic, message);
  }
}
