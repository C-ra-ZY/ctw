import { Module } from '@nestjs/common';
import { KafkaModule } from './modules/kafka.module';
import { WebSocketModule } from './modules/websocket.module';

@Module({
  imports: [],
  controllers: [],
  providers: [KafkaModule, WebSocketModule],
})
export class AppModule {}
