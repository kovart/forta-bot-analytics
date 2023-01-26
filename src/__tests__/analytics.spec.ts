import { BotAnalytics, BotAnalyticsOptions, BotStats } from '../analytics';
import { IBotStorage } from '../storage';

const GeneralAlertId = BotAnalytics.GeneralAlertId;

describe('BotAnalytics', () => {
  let mockAnalytics: BotAnalytics;

  const mockPersistence: jest.Mocked<IBotStorage<BotStats>> = {
    load: jest.fn(),
    save: jest.fn(),
  };

  const defaultConfigValues: BotAnalyticsOptions = {
    defaultAnomalyScore: { [GeneralAlertId]: 0.25 },
    observableInterval: 24 * 60 * 60,
    syncTimeout: 30 * 60,
    maxSyncDelay: 2 * 24 * 60 * 60,
  };

  beforeEach(() => {
    mockAnalytics = new BotAnalytics(mockPersistence, defaultConfigValues);
    mockPersistence.load.mockClear();
    mockPersistence.save.mockClear();
  });

  it('uses default score if sync data is missing', async () => {
    mockPersistence.load.mockResolvedValue(null);

    await mockAnalytics.sync(0);

    const score = mockAnalytics.getAnomalyScore();

    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
    expect(mockPersistence.load).toBeCalledWith(BotAnalytics.StorageKey);
  });

  it('uses default score if observation of sync data is not long enough', async () => {
    const observationStartTimestamp = 1000;
    const observationEndTimestamp =
      observationStartTimestamp + defaultConfigValues.observableInterval - 1;

    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 1 },
      botTriggers: { [GeneralAlertId]: 100 },
      startTimestamp: observationStartTimestamp,
      endTimestamp: observationEndTimestamp,
    });

    await mockAnalytics.sync(observationEndTimestamp + 1);

    const score = mockAnalytics.getAnomalyScore();

    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
    expect(mockPersistence.load).toBeCalledWith(BotAnalytics.StorageKey);
  });

  it('uses default score if sync data is outdated', async () => {
    const syncDataStartTimestamp = 1000;
    const syncDataEndTimestamp = syncDataStartTimestamp + defaultConfigValues.observableInterval;

    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 1 },
      botTriggers: { [GeneralAlertId]: 100 },
      startTimestamp: syncDataStartTimestamp,
      endTimestamp: syncDataEndTimestamp,
    });

    const localTimestamp = syncDataEndTimestamp + defaultConfigValues.maxSyncDelay + 1;

    await mockAnalytics.sync(localTimestamp);

    const score = mockAnalytics.getAnomalyScore();

    expect(score).toStrictEqual(defaultConfigValues.defaultAnomalyScore[GeneralAlertId]);
    expect(mockPersistence.load).toBeCalledWith(BotAnalytics.StorageKey);
  });

  it('uses default scores properly', async () => {
    mockAnalytics = new BotAnalytics(mockPersistence, {
      ...defaultConfigValues,
      defaultAnomalyScore: {
        [GeneralAlertId]: 0.4,
        ['alert-1']: 0.24,
      },
    });

    let score = mockAnalytics.getAnomalyScore();

    expect(score).toStrictEqual(0.4);

    score = mockAnalytics.getAnomalyScore('alert-1');

    expect(score).toStrictEqual(0.24);
  });

  it('uses sync data if observation of local data is not long enough', async () => {
    const syncDataStartTimestamp = 1000;
    const syncDataEndTimestamp = syncDataStartTimestamp + defaultConfigValues.observableInterval;

    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 1 },
      botTriggers: { [GeneralAlertId]: 100 },
      startTimestamp: syncDataStartTimestamp,
      endTimestamp: syncDataEndTimestamp,
    });

    // fetch sync data
    await mockAnalytics.sync(syncDataEndTimestamp);

    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 1 },
      botTriggers: { [GeneralAlertId]: 10 },
      startTimestamp: syncDataStartTimestamp,
      endTimestamp: syncDataEndTimestamp,
    });

    // refetch sync data
    await mockAnalytics.sync(syncDataEndTimestamp + defaultConfigValues.syncTimeout);

    const localModeStartTimestamp = syncDataEndTimestamp + defaultConfigValues.syncTimeout + 1;
    const localModeEndTimestamp = syncDataEndTimestamp + defaultConfigValues.observableInterval - 1;

    // observation period is less than the required one
    mockAnalytics.incrementBotTriggers(localModeStartTimestamp);
    mockAnalytics.incrementBotTriggers(localModeEndTimestamp);
    mockAnalytics.incrementAlertTriggers(localModeEndTimestamp);

    const score = mockAnalytics.getAnomalyScore();

    expect(score).toStrictEqual(1 / 10);
    expect(mockPersistence.load).toBeCalledWith(BotAnalytics.StorageKey);
    expect(mockPersistence.save).not.toBeCalled();
  });

  it('throws an error if there is no default value', async () => {
    mockAnalytics = new BotAnalytics(mockPersistence, {
      ...defaultConfigValues,
      defaultAnomalyScore: {},
    });

    expect(() => mockAnalytics.getAnomalyScore()).toThrow();
    expect(() => mockAnalytics.getAnomalyScore('unknown')).toThrow();
  });

  it('uses default score if there is trigger imbalance in sync data', async () => {
    const defaultAnomalyScore = {
      [GeneralAlertId]: 0.24,
      ['alert-1']: 0.2,
    };

    mockAnalytics = new BotAnalytics(mockPersistence, {
      ...defaultConfigValues,
      defaultAnomalyScore,
    });

    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 2, ['alert-1']: 1 },
      botTriggers: { [GeneralAlertId]: 1 },
      startTimestamp: 0,
      endTimestamp: defaultConfigValues.observableInterval,
    });

    await mockAnalytics.sync(defaultConfigValues.observableInterval);

    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(defaultAnomalyScore[GeneralAlertId]);
    expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(defaultAnomalyScore['alert-1']);
  });

  it('throws an error if there is trigger imbalance in local data', async () => {
    // local data
    mockAnalytics.incrementBotTriggers(0);
    mockAnalytics.incrementAlertTriggers(0);
    mockAnalytics.incrementAlertTriggers(0, 'alert-2');
    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);

    expect(() => mockAnalytics.getAnomalyScore()).toThrow();
    expect(() => mockAnalytics.getAnomalyScore('alert-2')).toThrow();
    await expect(async () => {
      await mockAnalytics.sync(defaultConfigValues.observableInterval);
    }).rejects.toThrow();
  });

  it('calculates anomaly score / sync data', async () => {
    mockPersistence.load.mockResolvedValue({
      alertTriggers: { [GeneralAlertId]: 1, ['alert-1']: 1 },
      botTriggers: { [GeneralAlertId]: 100, ['alert-1']: 4 },
      startTimestamp: 0,
      endTimestamp: defaultConfigValues.observableInterval,
    });

    await mockAnalytics.sync(defaultConfigValues.observableInterval);

    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 100);
    expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(1 / 4);
  });

  it('calculates anomaly score / local data', async () => {
    mockAnalytics.incrementBotTriggers(0);
    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);
    mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval);

    mockAnalytics.incrementBotTriggers(0, 'alert-1');
    mockAnalytics.incrementBotTriggers(1, 'alert-1');
    mockAnalytics.incrementBotTriggers(2, 'alert-1');
    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval, 'alert-1');
    mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval, 'alert-1');

    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 2);
    expect(mockAnalytics.getAnomalyScore('alert-1')).toStrictEqual(1 / 4);

    mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval * 2);

    expect(mockAnalytics.getAnomalyScore()).toStrictEqual(1 / 2);
  });

  it('uploads sync data if observation period of local data is long enough', async () => {
    const startTimestamp = 100;
    const endTimestamp = startTimestamp + defaultConfigValues.observableInterval;

    mockAnalytics.incrementBotTriggers(startTimestamp);
    mockAnalytics.incrementBotTriggers(endTimestamp);
    mockAnalytics.incrementAlertTriggers(endTimestamp);

    mockPersistence.load.mockResolvedValue(null);
    mockPersistence.save.mockResolvedValue();

    await mockAnalytics.sync(endTimestamp);

    expect(mockPersistence.save).toBeCalledWith(BotAnalytics.StorageKey, {
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      botTriggers: { [GeneralAlertId]: 2 },
      alertTriggers: { [GeneralAlertId]: 1 },
    });
  });

  it("doesn't upload sync data if previous update was recent", async () => {
    const startTimestamp = 100;
    const lastTimestamp = startTimestamp + defaultConfigValues.observableInterval;

    mockAnalytics.incrementBotTriggers(startTimestamp);
    mockAnalytics.incrementBotTriggers(lastTimestamp);
    mockAnalytics.incrementAlertTriggers(lastTimestamp);

    await mockAnalytics.sync(lastTimestamp);

    expect(mockPersistence.save).toBeCalled();
    mockPersistence.save.mockReset();

    await mockAnalytics.sync(lastTimestamp + defaultConfigValues.syncTimeout - 1);

    expect(mockPersistence.save).not.toBeCalled();

    mockAnalytics.incrementBotTriggers(lastTimestamp + defaultConfigValues.syncTimeout);

    await mockAnalytics.sync(lastTimestamp + defaultConfigValues.syncTimeout);

    expect(mockPersistence.save).toBeCalled();
  });

  it("doesn't upload sync data if local data has no any value", async () => {
    mockAnalytics.incrementBotTriggers(0);
    mockAnalytics.incrementBotTriggers(defaultConfigValues.observableInterval);
    mockAnalytics.incrementAlertTriggers(defaultConfigValues.observableInterval);

    // we should remove all previous triggers that are not in the observable interval
    await mockAnalytics.sync(defaultConfigValues.observableInterval * 2 + 1);

    expect(mockPersistence.save).not.toBeCalled();
  });

  it('uploads correct sync data when observation period is longer than "observableInterval"', async () => {
    const startTimestamp = 100;
    const lastTimestamp = startTimestamp + defaultConfigValues.observableInterval;

    await mockAnalytics.incrementBotTriggers(startTimestamp);
    await mockAnalytics.incrementBotTriggers(startTimestamp + 1);
    await mockAnalytics.incrementAlertTriggers(startTimestamp + 1);
    await mockAnalytics.incrementBotTriggers(lastTimestamp);
    await mockAnalytics.incrementAlertTriggers(lastTimestamp);

    await mockAnalytics.sync(lastTimestamp + 1);

    expect(mockPersistence.save).toBeCalledWith(BotAnalytics.StorageKey, {
      startTimestamp: startTimestamp + 1,
      endTimestamp: lastTimestamp + 1,
      botTriggers: { [GeneralAlertId]: 2 },
      alertTriggers: { [GeneralAlertId]: 2 },
    });
  });
});
