export interface IRallyActivityMetrics {
    totalPool: number;
    forTotal: number;
    againstTotal: number;
    participantCount: number;
    hourlyActivity: number;
    momentumLevel: 'Low' | 'Medium' | 'High';
    activityMultiplier: number;
}

export interface IRallyUserStats {
    poolContribution: number; // Percentage of total pool
    positionFactor: number; // Same as pool contribution but different display
    timingFactor: number; // Based on percentile when bet
    activityLevel: 'Low' | 'Medium' | 'High';
    percentileRank: number; // 0-1, where they stand in timing
}

export default interface IRallyMetricsService {
    updateRallyMetrics(
        rallyPredictionId: string,
        amount: number,
        forOrAgainst: boolean,
        timestamp?: Date
    ): Promise<void>;

    getRallyMetrics(rallyPredictionId: string): Promise<IRallyActivityMetrics | null>;

    calculateUserStats(
        rallyPredictionId: string,
        userAmount: number,
        betTimestamp: Date
    ): Promise<IRallyUserStats>;

    getActivityLevel(rallyPredictionId: string, timeWindowHours?: number): Promise<'Low' | 'Medium' | 'High'>;

    calculatePercentileWhenBet(
        rallyPredictionId: string,
        betTimestamp: Date
    ): Promise<number>;
}
