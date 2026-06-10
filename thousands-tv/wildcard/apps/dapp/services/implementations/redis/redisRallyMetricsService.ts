import { injectable } from "inversify";
import Redis from "ioredis";
import IRallyMetricsService, { IRallyActivityMetrics, IRallyUserStats } from "@/services/interfaces/IRallyMetricsService";

@injectable()
export default class RedisRallyMetricsService implements IRallyMetricsService {
    private redis: Redis;

    private readonly CONFIG = {
        BASE_FRACTION: 0.75,
        TIME_BONUS_MAX: 0.05,
        ACTIVITY_THRESHOLDS: {
            LOW: 5,
            MEDIUM: 20,
            HIGH: 50
        },
        TIME_WINDOW_HOURS: 24
    };

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
        });
    }

    async updateRallyMetrics(
        rallyPredictionId: string,
        amount: number,
        forOrAgainst: boolean,
        timestamp: Date = new Date()
    ): Promise<void> {
        console.log(`Mock: Updated rally metrics for ${rallyPredictionId} with amount ${amount}, side: ${forOrAgainst ? 'for' : 'against'}`);
        return Promise.resolve();
    }

    async getRallyMetrics(rallyPredictionId: string): Promise<IRallyActivityMetrics | null> {
        return {
            totalPool: 15000,
            forTotal: 8500,
            againstTotal: 6500,
            participantCount: 45,
            hourlyActivity: 35.5,
            momentumLevel: 'High',
            activityMultiplier: 1.5,
        };
    } async calculateUserStats(
        rallyPredictionId: string,
        userAmount: number,
        betTimestamp: Date
    ): Promise<IRallyUserStats> {
        const mockTotalPool = 15000;
        const poolContribution = (userAmount / mockTotalPool) * 100;
        const positionFactor = Math.min(poolContribution / 100, 2.0);

        const percentileRank = Math.random() * 0.8 + 0.1;
        const timingFactor = 1 + (this.CONFIG.TIME_BONUS_MAX * (1 - percentileRank));

        return {
            poolContribution,
            positionFactor,
            timingFactor,
            activityLevel: 'High',
            percentileRank,
        };
    }

    async calculatePercentileWhenBet(
        rallyPredictionId: string,
        betTimestamp: Date
    ): Promise<number> {
        return Math.random() * 0.8 + 0.1;
    }

    async getActivityLevel(rallyPredictionId: string, timeWindowHours: number = 1): Promise<'Low' | 'Medium' | 'High'> {
        const levels: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
        return levels[Math.floor(Math.random() * levels.length)];
    }


    private async calculateHourlyActivity(rallyPredictionId: string, timeWindowHours: number = 1): Promise<number> {
        const key = `rally:${rallyPredictionId}`;
        const now = new Date();
        let totalCredits = 0;
        let hourCount = 0;

        for (let i = 0; i < timeWindowHours; i++) {
            const hourTime = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const hourKey = this.getHourKey(hourTime);
            const credits = await this.redis.hget(`${key}:activity:${hourKey}`, 'credits');

            if (credits) {
                totalCredits += parseInt(credits);
                hourCount++;
            }
        }

        return hourCount > 0 ? totalCredits / hourCount : 0;
    }

    private determineMomentumLevel(hourlyActivity: number): 'Low' | 'Medium' | 'High' {
        if (hourlyActivity >= this.CONFIG.ACTIVITY_THRESHOLDS.HIGH) {
            return 'High';
        } else if (hourlyActivity >= this.CONFIG.ACTIVITY_THRESHOLDS.MEDIUM) {
            return 'Medium';
        } else {
            return 'Low';
        }
    }

    private calculateActivityMultiplier(momentumLevel: 'Low' | 'Medium' | 'High'): number {
        switch (momentumLevel) {
            case 'High': return 1.5;
            case 'Medium': return 1.25;
            case 'Low': return 1.0;
            default: return 1.0;
        }
    }

    private getHourKey(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        return `${year}${month}${day}${hour}`;
    }
}
