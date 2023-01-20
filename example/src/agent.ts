/* eslint-disable no-console */
import { Finding, HandleTransaction, TransactionEvent, HandleBlock } from 'forta-agent';

// this library is the output of the parent project after the `npm run build'.
import { BotAnalytics, FortaBotStorage } from './lib';

export const ERC20_TRANSFER_EVENT =
  'event Transfer(address indexed from, address indexed to, uint256 value)';
export const TETHER_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
export const TETHER_DECIMALS = 6;
export const TRANSFER_THRESHOLD = 500; // USDT

const analytics = new BotAnalytics(new FortaBotStorage(console.log), {
  logFn: console.log,
  maxSyncDelay: 30 * 60, // 30m
  syncTimeout: 60, // 60s
  observableInterval: 30 * 60, // 30m
  defaultAnomalyScore: { [BotAnalytics.GeneralAlertId]: 0.123 },
});

const handleBlock: HandleBlock = async (blockEvent) => {
  const anomalyScore = analytics.getAnomalyScore();
  console.log(blockEvent.blockNumber, 'Anomaly score', anomalyScore);

  return [];
};

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  await analytics.sync(txEvent.timestamp);

  const findings: Finding[] = [];

  // filter the transaction logs for Tether transfer events
  const tetherTransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT, TETHER_ADDRESS);

  tetherTransferEvents.forEach((transferEvent) => {
    analytics.incrementBotTriggers(txEvent.timestamp);

    // extract transfer event arguments
    const { value } = transferEvent.args;
    // shift decimals of transfer value
    const normalizedValue = value.div(10 ** TETHER_DECIMALS);

    // if more than threshold were transferred, report it
    if (normalizedValue.gt(TRANSFER_THRESHOLD)) {
      analytics.incrementAlertTriggers(txEvent.timestamp);
      // findings.push(
      //   Finding.fromObject({
      //     name: 'High Tether Transfer',
      //     description: `High amount of USDT transferred: ${normalizedValue}`,
      //     alertId: 'FORTA-1',
      //     severity: FindingSeverity.Low,
      //     type: FindingType.Info,
      //     metadata: {
      //       to,
      //       from,
      //       anomaly_score: anomalyScore.toString(),
      //     },
      //   }),
      // );
    }
  });

  return findings;
};

export default {
  handleBlock,
  handleTransaction,
};
