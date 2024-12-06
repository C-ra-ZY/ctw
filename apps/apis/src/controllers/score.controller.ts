import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ScoreService } from '../services/score.service';
import { AuditService } from 'src/services/audit.service';

@Controller('score')
export class ScoreController {
  constructor(
    private readonly scoreService: ScoreService,
    private readonly auditService: AuditService,
  ) {}

  @Put('user/:userId/:score')
  async setUserScore(
    @Param('userId') userId: string,
    @Param('score') score: number,
  ): Promise<{ rank: number }> {
    const rank = await this.scoreService.setUserScore(userId, score);
    this.auditService.logAction('userId', 'update', { score });
    return { rank };
  }

  @Get('rank/:pageId')
  async getRankPage(
    @Param('pageId') pageId: number,
  ): Promise<{ userId: string; score: number }[]> {
    return await this.scoreService.getRankPage(pageId);
  }

  @Get('rank/user-self')
  async getUserSelfRank(
    @Query('userId') userId: string,
  ): Promise<{ rank: number | null }> {
    const rank = await this.scoreService.getUserRank(userId);
    if (rank === null) {
      throw new NotFoundException('Resource not found');
    }
    return { rank };
  }

  @Get('rank/user/:userId')
  async getUserNearbyRanks(
    @Param('userId') userId: string,
  ): Promise<{ userId: string; score: number }[]> {
    return await this.scoreService.getUserNearbyRanks(userId);
  }
}
