import { Test, TestingModule } from '@nestjs/testing';
import { ScoreService } from './score.service';
import { RedisService } from './redis.service';
import { NotificationService } from './notification.service';

describe('ScoreService', () => {
  let scoreService: ScoreService;
  let redisServiceMock: jest.Mocked<RedisService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreService,
        {
          provide: RedisService,
          useFactory: () => ({
            getScore: jest.fn(),
            addOrUpdateUser: jest.fn(),
            getRank: jest.fn(),
            getUsersAffectedByScore: jest.fn(),
            getSortedSetByRankDesc: jest.fn(),
            getOnlineUsers: jest.fn(),
          }),
        },
        {
          provide: NotificationService,
          useFactory: () => ({
            sendScoreUpdateNotification: jest.fn(),
          }),
        },
      ],
    }).compile();

    scoreService = module.get<ScoreService>(ScoreService);
    redisServiceMock = module.get(RedisService);
    notificationServiceMock = module.get(NotificationService);
  });

  describe('setUserScore', () => {
    it('should update user score and return rank', async () => {
      const userId = 'user1';
      const score = 100;
      const staleCompositeScore = 50;
      const updatedCompositeScore = 100;
      const rank = 5;

      // Mock Redis service methods
      redisServiceMock.getScore.mockResolvedValue(staleCompositeScore);
      redisServiceMock.addOrUpdateUser.mockResolvedValue(updatedCompositeScore);
      redisServiceMock.getRank.mockResolvedValue(rank);
      redisServiceMock.getUsersAffectedByScore.mockResolvedValue([
        'user2',
        'user3',
      ]);
      redisServiceMock.getOnlineUsers.mockResolvedValue(['user2']);

      // Mock Notification service method
      notificationServiceMock.sendScoreUpdateNotification.mockResolvedValue(
        undefined,
      );

      const result = await scoreService.setUserScore(userId, score);

      // Verify Redis service method calls
      expect(redisServiceMock.getScore).toHaveBeenCalledWith(
        'score_leaderboard',
        userId,
      );
      expect(redisServiceMock.addOrUpdateUser).toHaveBeenCalledWith(
        'score_leaderboard',
        userId,
        score,
        expect.any(Number),
      );
      expect(redisServiceMock.getRank).toHaveBeenCalledWith(
        'score_leaderboard',
        userId,
      );
      expect(redisServiceMock.getUsersAffectedByScore).toHaveBeenCalledWith(
        'score_leaderboard',
        staleCompositeScore,
        updatedCompositeScore,
      );
      expect(redisServiceMock.getOnlineUsers).toHaveBeenCalled();

      // Verify Notification service method call
      expect(
        notificationServiceMock.sendScoreUpdateNotification,
      ).toHaveBeenCalledWith(userId, []);

      // Verify return value
      expect(result).toBe(rank + 1);
    });

    it('should return -1 if rank is null', async () => {
      const userId = 'user1';
      const score = 100;

      // Mock Redis service methods to return null rank
      redisServiceMock.getScore.mockResolvedValue(null);
      redisServiceMock.addOrUpdateUser.mockResolvedValue(100);
      redisServiceMock.getRank.mockResolvedValue(null);

      const result = await scoreService.setUserScore(userId, score);

      // Verify return value
      expect(result).toBe(-1);

      // Verify no notification is sent
      expect(
        notificationServiceMock.sendScoreUpdateNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getRankPage', () => {
    it('should return correct page of ranks', async () => {
      const pageId = 2;
      const mockResults = [
        { userId: 'user1', score: 100, updateTime: new Date().toISOString() },
        { userId: 'user2', score: 90, updateTime: new Date().toISOString() },
      ];

      redisServiceMock.getSortedSetByRankDesc.mockResolvedValue(mockResults);

      const result = await scoreService.getRankPage(pageId);

      // Verify Redis service method call
      expect(redisServiceMock.getSortedSetByRankDesc).toHaveBeenCalledWith(
        'score_leaderboard',
        100,
        199,
      );

      // Verify return value
      expect(result.length).toEqual(2);
    });
  });

  describe('getUserRank', () => {
    it('should return user rank + 1', async () => {
      const userId = 'user1';
      const mockRank = 4;

      redisServiceMock.getRank.mockResolvedValue(mockRank);

      const result = await scoreService.getUserRank(userId);

      // Verify Redis service method call
      expect(redisServiceMock.getRank).toHaveBeenCalledWith(
        'score_leaderboard',
        userId,
      );

      // Verify return value
      expect(result).toBe(mockRank + 1);
    });

    it('should return null if rank is null', async () => {
      const userId = 'user1';

      redisServiceMock.getRank.mockResolvedValue(null);

      const result = await scoreService.getUserRank(userId);

      // Verify return value
      expect(result).toBeNull();
    });
  });

  describe('getUserNearbyRanks', () => {
    it('should return nearby ranks', async () => {
      const userId = 'user1';
      const mockRank = 10;
      const mockResults = [
        { userId: 'user5', score: 95, updateTime: new Date().toString() },
        { userId: 'user6', score: 90, updateTime: new Date().toString() },
      ];

      redisServiceMock.getRank.mockResolvedValue(mockRank);
      redisServiceMock.getSortedSetByRankDesc.mockResolvedValue(mockResults);

      const result = await scoreService.getUserNearbyRanks(userId);

      // Verify Redis service method calls
      expect(redisServiceMock.getRank).toHaveBeenCalledWith(
        'score_leaderboard',
        userId,
      );
      expect(redisServiceMock.getSortedSetByRankDesc).toHaveBeenCalledWith(
        'score_leaderboard',
        5,
        14,
      );

      // Verify return value
      expect(result).toEqual(mockResults);
    });

    it('should return empty array if rank is null', async () => {
      const userId = 'user1';

      redisServiceMock.getRank.mockResolvedValue(null);

      const result = await scoreService.getUserNearbyRanks(userId);

      // Verify return value
      expect(result).toEqual([]);
    });
  });
});
