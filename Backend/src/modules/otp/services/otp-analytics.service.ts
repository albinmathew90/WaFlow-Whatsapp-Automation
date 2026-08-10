import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpAnalyticsDaily } from '../entities/otp-analytics-daily.entity';

@Injectable()
export class OtpAnalyticsService {
  constructor(
    @InjectRepository(OtpAnalyticsDaily, 'data')
    private readonly analyticsRepo: Repository<OtpAnalyticsDaily>,
  ) {}

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async incrementMetric(
    applicationId: string,
    metric: 'totalRequests' | 'verified' | 'failed' | 'expired' | 'delivered' | 'read',
    count: number = 1
  ) {
    const date = this.getTodayString();
    const { randomUUID } = require('crypto');
    const id = randomUUID();
    
    // Proper upsert with increment for PostgreSQL/SQLite
    await this.analyticsRepo.query(`
      INSERT INTO otp_analytics_daily ("id", "applicationId", "date", "${metric}")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("applicationId", "date")
      DO UPDATE SET "${metric}" = otp_analytics_daily."${metric}" + EXCLUDED."${metric}"
    `, [id, applicationId, date, count]);
  }

  async getAnalytics(applicationId: string) {
    const date = this.getTodayString();
    let record = await this.analyticsRepo.findOne({ where: { applicationId, date } });
    if (!record) {
      record = this.analyticsRepo.create({
        applicationId,
        date,
        totalRequests: 0,
        verified: 0,
        failed: 0,
        expired: 0,
        delivered: 0,
        read: 0,
      });
    }
    
    const successRate = record.totalRequests > 0 
      ? Math.round((record.verified / record.totalRequests) * 100) 
      : 0;

    return {
      todayRequests: record.totalRequests,
      successfulVerifications: record.verified,
      failedRequests: record.failed,
      successRate
    };
  }

  async getDashboardSummary(applicationId: string) {
    const query = this.analyticsRepo.createQueryBuilder('analytics')
      .select('SUM(analytics.totalRequests)', 'totalRequests')
      .addSelect('SUM(analytics.verified)', 'verified')
      .addSelect('SUM(analytics.failed)', 'failed')
      .addSelect('SUM(analytics.expired)', 'expired')
      .addSelect('SUM(analytics.delivered)', 'delivered')
      .addSelect('SUM(analytics.read)', 'read')
      .where('analytics.applicationId = :applicationId', { applicationId });

    const result = await query.getRawOne();

    const totalRequests = parseInt(result.totalRequests || '0', 10);
    const verified = parseInt(result.verified || '0', 10);
    const failed = parseInt(result.failed || '0', 10);
    const expired = parseInt(result.expired || '0', 10);
    const delivered = parseInt(result.delivered || '0', 10);

    const verificationRate = totalRequests > 0 ? Math.round((verified / totalRequests) * 100) : 0;
    const deliveryRate = totalRequests > 0 ? Math.round((delivered / totalRequests) * 100) : 0;

    return {
      totalRequests,
      verified,
      failed,
      expired,
      deliveryRate,
      verificationRate,
    };
  }

  async getChartData(applicationId: string, days: number = 30) {
    // For a real production app we would generate the dates and left join, 
    // but for simplicity we'll just fetch what we have and sort it
    const data = await this.analyticsRepo.createQueryBuilder('analytics')
      .where('analytics.applicationId = :applicationId', { applicationId })
      .orderBy('analytics.date', 'ASC')
      .limit(days)
      .getMany();

    return data.map(d => ({
      date: d.date,
      requests: d.totalRequests,
      verified: d.verified,
      failed: d.failed,
      delivered: d.delivered,
    }));
  }
}
