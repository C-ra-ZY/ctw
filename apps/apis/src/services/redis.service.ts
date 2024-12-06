import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private onlineClient: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: 'localhost', // score redis address
      port: 6379,
    });
    this.onlineClient = new Redis({
      host: 'localhost', // online users redis address
      port: 6479,
    });
  }

  onModuleDestroy() {
    this.client.quit();
    this.onlineClient.quit();
  }

  // 计算复合分数，score 是主分数，updateTime 是次级分数
  private calculateCompositeScore(score: number, updateTime: number): number {
    // 将 updateTime 转换为时间戳（毫秒）
    // 使用一个非常大的数值（例如 1e12）来确保 score 和 timestamp 不会混淆
    return score + updateTime / 1e12;
  }

  // 插入或更新用户分数
  async addOrUpdateUser(
    key: string,
    userId: string,
    score: number,
    updateTime: number,
  ): Promise<number> {
    const compositeScore = this.calculateCompositeScore(score, updateTime);
    await this.client.zadd(key, compositeScore, userId);
    return compositeScore;
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.onlineClient.smembers('online_users');
  }

  async getUsersAffectedByScore(
    key: string,
    staleCompositeScore: number,
    updatedCompositeScore: number,
  ): Promise<string[]> {
    // 查询所有分数小于目标分数的用户
    // ZRANGEBYSCORE key min max [WITHSCORES]
    const results = await this.client.zrangebyscore(
      key,
      Math.min(staleCompositeScore, updatedCompositeScore),
      Math.max(staleCompositeScore, updatedCompositeScore),
    );
    return results;
  }

  // 获取有序集合的用户及其分数，按分数升序排列
  async getSortedSetByRankAsc(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ userId: string; score: number; updateTime: string }[]> {
    const results = await this.client.zrange(key, start, stop, 'WITHSCORES');
    const parsedResults: {
      userId: string;
      score: number;
      updateTime: string;
    }[] = [];

    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i]; // 用户 ID
      const compositeScore = parseFloat(results[i + 1]);

      // 分离 score 和 updateTime
      const timestamp = (compositeScore % 1) * 1e12;
      const score = Math.floor(compositeScore);
      const updateTime = new Date(timestamp).toISOString();

      parsedResults.push({ userId, score, updateTime });
    }

    return parsedResults;
  }

  // 获取有序集合的用户及其分数，按分数降序排列
  async getSortedSetByRankDesc(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ userId: string; score: number; updateTime: string }[]> {
    const results = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
    const parsedResults: {
      userId: string;
      score: number;
      updateTime: string;
    }[] = [];

    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i]; // 用户 ID
      const compositeScore = parseFloat(results[i + 1]);

      // 分离 score 和 updateTime
      const timestamp = (compositeScore % 1) * 1e12;
      const score = Math.floor(compositeScore);
      const updateTime = new Date(timestamp).toISOString();

      parsedResults.push({ userId, score, updateTime });
    }

    return parsedResults;
  }

  // 获取用户的排名，排名按分数升序排列
  async getRank(key: string, userId: string): Promise<number | null> {
    const rank = await this.client.zrank(key, userId);
    return rank ?? null;
  }

  // 获取用户的分数
  async getScore(key: string, userId: string): Promise<number | null> {
    const score = await this.client.zscore(key, userId);
    return score ? parseFloat(score) : null;
  }

  // 获取指定分数区间的所有用户及其分数
  async getUsersInScoreRange(
    key: string,
    minScore: number,
    maxScore: number,
  ): Promise<{ userId: string; score: number; updateTime: string }[]> {
    const results = await this.client.zrangebyscore(
      key,
      minScore,
      maxScore,
      'WITHSCORES',
    );
    const parsedResults: {
      userId: string;
      score: number;
      updateTime: string;
    }[] = [];

    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i]; // 用户 ID
      const compositeScore = parseFloat(results[i + 1]);

      // 分离 score 和 updateTime
      const timestamp = (compositeScore % 1) * 1e12;
      const score = Math.floor(compositeScore);
      const updateTime = new Date(timestamp).toISOString();

      parsedResults.push({ userId, score, updateTime });
    }

    return parsedResults;
  }
}
