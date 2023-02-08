import { IBotStorage, LogFunction } from './storage';
export enum TriggerType {
  Bot = 0,
  Alert = 1,
}

export type BotAnalyticsOptions = {
  key?: string;
  defaultAnomalyScore: {
    [key: string]: number;
  };
  syncTimeout: number;
  maxSyncDelay: number;
  observableInterval: number; // in seconds
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

export class BotAnalytics {
  private log: LogFunction;
  private storage: IBotStorage<BotStats>;
  private triggersByAlertId = new Map<string, { type: TriggerType; timestamp: number }[]>();
  private syncStats: BotStats | null = null;
  private firstLocalTimestamp = -1;
  private lastLocalTimestamp = -1;
  private lastSyncTimestamp = -1;

  private readonly botKey: string;
  private readonly syncTimeout: number;
  private readonly maxSyncDelay: number;
  private readonly observableInterval: number;
  private readonly defaultAnomalyScore: {
    [key: string]: number;
  };

  static readonly StorageKey = 'stats-v1';
  static readonly GeneralAlertId = 'GENERAL';
  static readonly TriggerImbalanceErrorCode = 'TriggerImbalanceError';
  static readonly NoDefaultScoreErrorCode = 'NoDefaultScoreError';

  constructor(storage: IBotStorage<BotStats>, opts: BotAnalyticsOptions) {
    const { defaultAnomalyScore, observableInterval, syncTimeout, maxSyncDelay, key, logFn } = opts;

    this.storage = storage;
    this.syncTimeout = syncTimeout;
    this.maxSyncDelay = maxSyncDelay;
    this.observableInterval = observableInterval;
    this.defaultAnomalyScore = defaultAnomalyScore;
    this.botKey = BotAnalytics.StorageKey + '#' + (key || '');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.log = logFn || (() => {});
  }

  private updateLocalTimestamps(timestamp: number) {
    if (this.firstLocalTimestamp === -1 || this.firstLocalTimestamp > timestamp)
      this.firstLocalTimestamp = timestamp;
    if (this.lastLocalTimestamp === -1 || this.lastLocalTimestamp < timestamp)
      this.lastLocalTimestamp = timestamp;
  }

  private getLocalStats(): BotStats {
    const botTriggers: { [alertId: string]: number } = {};
    const alertTriggers: { [alertId: string]: number } = {};

    for (const alertId of this.triggersByAlertId.keys()) {
      for (const { type } of this.triggersByAlertId.get(alertId) || []) {
        if (type === TriggerType.Bot)
          botTriggers[alertId] = botTriggers[alertId] ? botTriggers[alertId] + 1 : 1;
        else if (type === TriggerType.Alert)
          alertTriggers[alertId] = alertTriggers[alertId] ? alertTriggers[alertId] + 1 : 1;
      }
    }

    return {
      startTimestamp: Math.max(
        0,
        this.firstLocalTimestamp,
        this.lastLocalTimestamp - this.observableInterval,
      ),
      endTimestamp: Math.max(0, this.lastLocalTimestamp),
      botTriggers,
      alertTriggers,
    };
  }

  private clearOutdatedTriggerRecords(minTimestamp: number): void {
    for (const alertId of this.triggersByAlertId.keys()) {
      const records = this.triggersByAlertId.get(alertId) || [];
      this.triggersByAlertId.set(
        alertId,
        records.filter((r) => r.timestamp >= minTimestamp),
      );
    }
  }

  private isTriggerImbalance(stats: BotStats) {
    for (const alertId of Object.keys(stats.alertTriggers)) {
      if (
        stats.botTriggers[alertId] == null ||
        (stats.botTriggers[alertId] || 0) < (stats.alertTriggers[alertId] || 0)
      ) {
        return true;
      }
    }
  }

  async sync(timestamp: number): Promise<void> {
    this.updateLocalTimestamps(timestamp);

    this.clearOutdatedTriggerRecords(timestamp - this.observableInterval);

    const localStats = this.getLocalStats();

    if (this.isTriggerImbalance(localStats))
      throw new Error(BotAnalytics.TriggerImbalanceErrorCode);

    if (this.lastSyncTimestamp >= 0 && timestamp - this.lastSyncTimestamp < this.syncTimeout)
      return;

    const syncStats = await this.storage.load(this.botKey);

    this.log('sync()', timestamp, localStats, syncStats);

    const isLocalIntervalSufficient =
      timestamp - this.firstLocalTimestamp >= this.observableInterval;

    if (syncStats) {
      /* check if it is a first time sync or the local stats interval is not sufficient */
      if (this.lastSyncTimestamp < 0 || !isLocalIntervalSufficient) {
        if (
          /* check if sync data is not outdated */
          timestamp - syncStats.endTimestamp < this.maxSyncDelay &&
          /* check if sync data interval is sufficient */
          syncStats.endTimestamp - syncStats.startTimestamp >= this.observableInterval
        ) {
          this.syncStats = syncStats;
          this.log('Sync data is updated');
        } else {
          this.log('Sync data is skipped');
        }
      }
    }

    if (
      /* check if the local stats interval is sufficient */
      isLocalIntervalSufficient &&
      /* check if the local stats are more recent than the sync one */
      (!syncStats || syncStats.endTimestamp < timestamp) &&
      /* check if the local stats has at least one non-zero value */
      Object.values(localStats.botTriggers).find((v) => v > 0)
    ) {
      await this.storage.save(this.botKey, localStats);
      this.log('Sync data is uploaded successfully');
    }

    this.lastSyncTimestamp = timestamp;
  }

  incrementBotTriggers(timestamp: number, alertId = BotAnalytics.GeneralAlertId) {
    const triggers = this.triggersByAlertId.get(alertId) || [];
    triggers.push({ timestamp, type: TriggerType.Bot });
    this.triggersByAlertId.set(alertId, triggers);

    this.updateLocalTimestamps(timestamp);
  }

  incrementAlertTriggers(timestamp: number, alertId = BotAnalytics.GeneralAlertId) {
    const triggers = this.triggersByAlertId.get(alertId) || [];
    triggers.push({ timestamp, type: TriggerType.Alert });
    this.triggersByAlertId.set(alertId, triggers);

    this.updateLocalTimestamps(timestamp);
  }

  getAnomalyScore(alertId = BotAnalytics.GeneralAlertId): number {
    if (this.lastLocalTimestamp > 0) {
      this.clearOutdatedTriggerRecords(this.lastLocalTimestamp - this.observableInterval);
    }

    if (this.lastLocalTimestamp - this.firstLocalTimestamp >= this.observableInterval) {
      const stats = this.getLocalStats();

      this.log('getAnomalyScore()', 'Using local data');

      if (this.isTriggerImbalance(stats)) {
        throw new Error(BotAnalytics.TriggerImbalanceErrorCode);
      }

      const alertTriggers = stats.alertTriggers[alertId];
      const botTriggers = stats.botTriggers[alertId];

      if (alertTriggers == null || alertTriggers <= 0) {
        this.log('getAnomalyScore()', 'Zero alert triggers, fallback to default score');
        return this.defaultAnomalyScore[alertId];
      }

      return alertTriggers / botTriggers;
    }

    if (this.syncStats && !this.isTriggerImbalance(this.syncStats)) {
      const alertTriggers = this.syncStats.alertTriggers[alertId];
      const botTriggers = this.syncStats.botTriggers[alertId];

      this.log('getAnomalyScore()', 'Using sync data');

      if (alertTriggers == null || alertTriggers <= 0) {
        this.log('getAnomalyScore()', 'Zero alert triggers, fallback to default score');
        return this.defaultAnomalyScore[alertId];
      }

      return alertTriggers / botTriggers;
    }

    this.log('getAnomalyScore()', 'Using default score');

    const defaultValue = this.defaultAnomalyScore[alertId];
    if (defaultValue == null) throw new Error(BotAnalytics.NoDefaultScoreErrorCode);
    return defaultValue;
  }
}
