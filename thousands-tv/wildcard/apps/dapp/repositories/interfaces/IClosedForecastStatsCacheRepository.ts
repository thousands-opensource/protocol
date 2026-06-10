/**
 * Interface for caching closed forecast statistics
 */
export interface ClosedForecastStats {
    correctCalls: number;
    incorrectCalls: number;
    totalUsers: number;
    totalWCEarned: number;
    duration: number;
    startDate: Date;
    endDate: Date;
    largestCorrectCall: number;
    largestIncorrectCall: number;
    resolvedChoice: boolean | null;
    winnerText: string | null;
}

/**
 * Repository interface for caching closed forecast statistics
 */
export default interface IClosedForecastStatsCacheRepository {
    /**
     * Get cached forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns The cached stats or null if not found
     */
    getStats(rallyPredictionId: string): Promise<ClosedForecastStats | null>;

    /**
     * Cache forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @param stats - The stats to cache
     * @param ttlSeconds - Time to live in seconds (optional)
     * @returns True if successful, false otherwise
     */
    setStats(
        rallyPredictionId: string,
        stats: ClosedForecastStats,
        ttlSeconds?: number
    ): Promise<boolean>;

    /**
     * Delete cached forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns True if successful, false otherwise
     */
    deleteStats(rallyPredictionId: string): Promise<boolean>;

    /**
     * Check if stats are cached
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns True if cached, false otherwise
     */
    hasStats(rallyPredictionId: string): Promise<boolean>;
}