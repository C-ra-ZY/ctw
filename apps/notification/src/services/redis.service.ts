import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: 'localhost', // online users redis address
      port: 6479,
    });
  }

  // 添加用户ID到Redis，标记用户在线
  async addUser(userId: string) {
    await this.redisClient.sadd('onlineUsers', userId); // 使用集合，避免重复添加
  }

  // 从Redis中删除用户ID，标记用户离线
  async removeUser(userId: string) {
    await this.redisClient.srem('onlineUsers', userId);
  }

  // 检查用户是否在线
  async isUserOnline(userId: string): Promise<boolean> {
    return !!(await this.redisClient.sismember('onlineUsers', userId));
  }

  // 获取所有在线用户
  async getAllOnlineUsers(): Promise<string[]> {
    return await this.redisClient.smembers('onlineUsers');
  }
}
