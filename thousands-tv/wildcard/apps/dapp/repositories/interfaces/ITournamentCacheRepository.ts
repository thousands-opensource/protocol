export default interface ITournamentCacheRepository {
    addTournamentTidToSet(tid: string): Promise<void>;
    isTournamentTidInSet(tid: string): Promise<boolean>;
}
