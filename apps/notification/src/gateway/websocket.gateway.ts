import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../services/redis.service';

@WebSocketGateway({
  port: 8081,
  cors: {
    origin: '*', // 生产环境请限制
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class NotificatoinWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  private clients: Map<string, Socket> = new Map(); // 存储在线用户的连接

  constructor(
    private readonly redisService: RedisService, // 引入 Redis 服务
  ) {}
  afterInit() {
    setInterval(() => {
      this.clients.forEach((client, userId) => {
        // 每个用户心跳检查，确保连接活跃
        client.emit('heartbeat', { status: 'alive' });
      });
    }, 10000); // 每10秒发一次心跳消息
  }

  // 用户连接时，添加到 Map 中并上报给 Redis
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (typeof userId === 'string' && userId) {
      this.clients.set(userId, client);
      await this.redisService.addUser(userId);
      console.log(`User ${userId} connected`);

      // 设置定时器用于心跳检测
      client.data.heartbeat = Date.now();
      this.startHeartbeatCheck(client);
    }
  }

  // 用户断开连接时，移除 Map 中的记录并从 Redis 中删除
  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId;
    if (typeof userId === 'string' && userId) {
      this.clients.delete(userId);
      await this.redisService.removeUser(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  // 心跳检测
  private startHeartbeatCheck(client: Socket) {
    setInterval(() => {
      const userId = client.handshake.query.userId;
      if (client.data.heartbeat && Date.now() - client.data.heartbeat > 30000) {
        // 30秒内没有心跳，则认为连接断开，主动断开并从Redis移除用户
        if (typeof userId === 'string' && userId) {
          console.log(`User ${userId} timed out, disconnecting`);
          client.disconnect();
          this.redisService.removeUser(userId);
        }
      }
    }, 10000); // 每10秒检测一次
  }

  // 接收客户端的心跳消息
  handleHeartbeat(client: Socket) {
    client.data.heartbeat = Date.now();
  }

  // 发送消息给特定的用户
  sendMessageToUser(userId: string, message: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.emit('message', message);
    }
  }
}
