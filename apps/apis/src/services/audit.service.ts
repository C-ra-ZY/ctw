import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  logAction(userId: string, action: string, data: any) {
    const logMessage = `User ${userId} performed action: ${action} with data: ${JSON.stringify(data)}`;
    this.logger.log(logMessage); // 将日志存储在数据库或日志系统中
  }
}
