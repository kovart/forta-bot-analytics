import { IBotStorage, LogFunction } from './storage';
export declare enum TriggerType {
    Bot = 0,
    Alert = 1
}
export type BotAnalyticsOptions = {
    defaultAnomalyScore: {
        [key: string]: number;
    };
    syncTimeout: number;
    maxSyncDelay: number;
    observableInterval: number;
    logFn?: LogFunction;
};
export type BotStats = {
    startTimestamp: number;
    endTimestamp: number;
    botTriggers: {
        [key: string]: number;
    };
    alertTriggers: {
        [key: string]: number;
    };
};
export declare class BotAnalytics {
    private log;
    private storage;
    private triggersByAlertId;
    private syncStats;
    private firstLocalTimestamp;
    private lastLocalTimestamp;
    private lastSyncTimestamp;
    private readonly syncTimeout;
    private readonly maxSyncDelay;
    private readonly observableInterval;
    private readonly defaultAnomalyScore;
    static readonly StorageKey = "stats-v1";
    static readonly GeneralAlertId = "GENERAL";
    static readonly TriggerImbalanceErrorCode = "TriggerImbalanceError";
    static readonly NoDefaultScoreErrorCode = "NoDefaultScoreError";
    constructor(storage: IBotStorage<BotStats>, opts: BotAnalyticsOptions);
    private updateLocalTimestamps;
    private getLocalStats;
    private clearOutdatedTriggerRecords;
    private isTriggerImbalance;
    sync(timestamp: number): Promise<void>;
    incrementBotTriggers(timestamp: number, alertId?: string): void;
    incrementAlertTriggers(timestamp: number, alertId?: string): void;
    getAnomalyScore(alertId?: string): number;
}
//# sourceMappingURL=analytics.d.ts.map