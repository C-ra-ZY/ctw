import { Module } from '@nestjs/common';
import { NotificatoinWebSocketGateway } from '../gateway/websocket.gateway';
import { RedisService } from '../services/redis.service'; // 引入 Redis 服务
import { KafkaService } from '../services/kafka.service'; // 引入 Kafka 服务

@Module({
  providers: [NotificatoinWebSocketGateway, RedisService, KafkaService],
})
export class WebSocketModule {}
