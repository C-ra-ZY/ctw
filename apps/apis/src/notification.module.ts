import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'], // Kafka 服务器地址
          },
          consumer: {
            groupId: 'score-update-group', // 消费者组
          },
        },
      },
    ]),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
