import config from './config';
import { getLogger } from './logger';
import { getOraclePriceForAssetAt, getPoolPriceAt, timestampToEpoch, epochToTimestamp } from './utils';

const depegRange = 0.02; // 2%

export async function runBotLoop(): Promise<void> {
  while (true) {
    const timestamp = Date.now() / 1000;
    const epoch = timestampToEpoch(timestamp);
    const startOfEpoch = epochToTimestamp(epoch);

    const epochDeviations = [];

    for (let i = 1; i <= 5; i++) {
      const dayTimestamp = startOfEpoch - (i * 86400);
      const poolPrice = await getPoolPriceAt(config.MINSWAP_POOL_ID, dayTimestamp);
      const oraclePrice = await getOraclePriceForAssetAt(config.INDIGO_ASSET_NAME, dayTimestamp);
      const deviation = (poolPrice - oraclePrice) / oraclePrice;

      epochDeviations.push(deviation);

      getLogger().debug(`Timestamp: ${dayTimestamp}, Pool price: ${poolPrice}, Oracle price: ${oraclePrice}, Deviation: ${deviation}`);
    }

    const averageDeviation =
      epochDeviations.reduce((acc, curr) => acc + curr, 0) / epochDeviations.length;

    const sign = averageDeviation === 0 ? 0 : averageDeviation > 0 ? 1 : -1;
    const quotient = averageDeviation / depegRange;
    const roundTo = sign * 0.05;
    // MROUND: rounds quotient to the nearest multiple of roundTo (could be 0)
    const ratio = roundTo === 0 ? 0 : Math.round(quotient / roundTo) * roundTo;

    const buyFee = Math.max(Math.min(ratio * 0.02, 0.02), 0.0005);
    const sellFee = Math.max(Math.min(ratio * -0.02, 0.02), 0.0005);

    getLogger().info(`Average deviation: ${averageDeviation}, Ratio: ${ratio}, Buy Fee: ${buyFee}, Sell Fee: ${sellFee}`);
    await new Promise((resolve) => setTimeout(resolve, 10_000)); // 10 seconds
  }
}