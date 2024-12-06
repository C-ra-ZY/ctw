import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { NotificationService } from './notification.service';

@Injectable()
export class ScoreService {
  private readonly leaderboardKey = 'score_leaderboard';
  private readonly pageSize = 100;

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async setUserScore(userId: string, score: number): Promise<number> {
    const staleCompositeScore =
      (await this.redisService.getScore(this.leaderboardKey, userId)) ?? 0;

    const updatedCompositeScore = await this.redisService.addOrUpdateUser(
      this.leaderboardKey,
      userId,
      score,
      Date.now(),
    );

    const rank = await this.redisService.getRank(this.leaderboardKey, userId);

    if (rank !== null) {
      const affectedUsers = await this.getUsersAffectedByScoreChange(
        staleCompositeScore,
        updatedCompositeScore,
      );
      const onlineUsers = new Set(
        ...(await this.redisService.getOnlineUsers()),
      );
      const affectedOnlineUsers = affectedUsers.filter((user) =>
        onlineUsers.has(user.userId),
      );
      await this.notificationService.sendScoreUpdateNotification(
        userId,
        affectedOnlineUsers,
      ); // 发送通知
    }

    return rank !== null ? rank + 1 : -1;
  }

  // 获取所有分数低于给定用户的用户，并获取其最新排名
  private async getUsersAffectedByScoreChange(
    staleCompositeScore: number,
    updatedCompositeScore: number,
  ): Promise<{ userId: string; rank: number }[]> {
    const affectedUsers: { userId: string; rank: number }[] = [];

    // 获取排名低于当前用户的所有用户
    const userIds = await this.redisService.getUsersAffectedByScore(
      this.leaderboardKey,
      staleCompositeScore,
      updatedCompositeScore,
    );
    for (const userId of userIds) {
      const rank = await this.redisService.getRank(this.leaderboardKey, userId);
      if (rank !== null) {
        affectedUsers.push({ userId: userId, rank: rank + 1 });
      }
    }

    return affectedUsers;
  }

  async getRankPage(
    pageId: number,
  ): Promise<{ userId: string; score: number }[]> {
    const start = (pageId - 1) * this.pageSize;
    const stop = start + this.pageSize - 1;
    const results = await this.redisService.getSortedSetByRankDesc(
      this.leaderboardKey,
      start,
      stop,
    );

    return results.map(({ userId, score }) => ({
      userId,
      score: score,
    }));
  }

  async getUserRank(userId: string): Promise<number | null> {
    const rank = await this.redisService.getRank(this.leaderboardKey, userId);
    return rank !== null ? rank + 1 : null;
  }

  async getUserNearbyRanks(
    userId: string,
  ): Promise<{ userId: string; score: number }[]> {
    const rank = await this.redisService.getRank(this.leaderboardKey, userId);
    if (rank === null) return [];

    const start = Math.max(rank - 5, 0);
    const stop = rank + 4;

    const results = await this.redisService.getSortedSetByRankDesc(
      this.leaderboardKey,
      start,
      stop,
    );

    return results;
  }
}
