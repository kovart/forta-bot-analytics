## Forta Bot Analytics

### Description

A helper library for semi-automatic calculation of the anomaly score for Forta bots.

### Usage example

```ts
const analytics = new BotAnalytics(new FortaBotStorage(), {
  maxSyncDelay: 7 * 24 * 60 * 60, // 7d
  syncTimeout: 5 * 60, // 5m
  observableInterval: 24 * 60 * 60, // 24h
  defaultAnomalyScore: { [BotAnalytics.GeneralAlertId]: 0.123 },
});

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  await analytics.sync(txEvent.timestamp);

  const tetherTransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT, TETHER_ADDRESS);

  tetherTransferEvents.forEach((transferEvent) => {
    analytics.incrementBotTriggers(txEvent.timestamp);

    const { value } = transferEvent.args;
    const normalizedValue = value.div(10 ** TETHER_DECIMALS);

    if (normalizedValue.gt(TRANSFER_THRESHOLD)) {
      analytics.incrementAlertTriggers(txEvent.timestamp);
      findings.push(
        Finding.fromObject({
          ...
          metadata: {
            anomaly_score: analytics.getAnomalyScore()
          }
        })
      );
    }
  })
};
```

### Sync algorithm

![Working algorithm](https://raw.githubusercontent.com/kovart/forta-bot-analytics/main/blob/algorithm.svg)
