export interface SharedRallyPredictionData {
    haltedUntil: Date | string | null;
}

export default interface IPredictionSharedCacheService {
    getCachedSharedRallyPrediction(forecastId: string): Promise<SharedRallyPredictionData | null>;
    cacheSharedRallyPrediction(forecastId: string, data: SharedRallyPredictionData): Promise<void>;
    clearSharedRallyPredictionCache(forecastId: string): Promise<void>;
    clearAllSharedRallyPredictionCache(): Promise<void>;
}
