import { fromText, Kupmios, Lucid, LucidEvolution } from '@lucid-evolution/lucid';
import { config } from './config.js';

export async function lucidFromConfig(): Promise<LucidEvolution> {
  // Initialize Lucid using Kupo and Ogmios
  const lucid = await Lucid(
    new Kupmios(
      `${config.KUPO_TLS ? 'https' : 'http'}://${config.KUPO_HOST}:${
        config.KUPO_PORT
      }`,
      `${config.OGMIOS_TLS ? 'https' : 'http'}://${config.OGMIOS_HOST}:${
        config.OGMIOS_PORT
      }`,
    ),
    config.NETWORK,
  );

  // Select wallet
  lucid.selectWallet.fromSeed(config.SEED_PHRASE, {
    accountIndex: config.ACCOUNT_INDEX,
  });

  return lucid;
}

export async function getOraclePriceForAssetAt(
  asset: string,
  at: number,
): Promise<number> {
  const response = await fetch(
    `${config.INDIGO_ANALYTICS_API_TLS ? 'https' : 'http'}://${config.INDIGO_ANALYTICS_API_HOST}:${config.INDIGO_ANALYTICS_API_PORT}/api/asset-prices`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: asset,
        timestamp: at,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to get oracle price: ${response.statusText}`);
  }

  const data = (await response.json()) as { asset: string; price: number }[];
  const assetData = data.find((entry) => entry.asset === asset);
  if (!assetData) {
    throw new Error(`Asset ${asset} not found in response`);
  }

  return assetData.price / 10 ** 6;
}

// Gets the close price of the daily candle for the given pool at the given timestamp
// Example curl request: curl --location 'https://api-mainnet-prod.minswap.org/v1/pools/5f0d38b3eb8fea72cd3cbdaa9594a74d0db79b5a27e85be5e9015bd6.5553444d2d555344412d534c50/price/candlestick?interval=1d&start_time=startofday&end_time=end_of_day'
export async function getPoolPriceAt(
  poolId: string,
  at: number,
): Promise<number> {
  // Calculate start and end of the day in seconds since epoch (UTC)
  const atMinute = Math.floor(at - (at % 60));
  const start = atMinute - 60 * 60 * 2; // 2 hours before the timestamp
  const end = atMinute + 60 * 60 * 2; // 2 hours after the timestamp
  const response = await fetch(
    `https://api-mainnet-prod.minswap.org/v1/pools/${poolId}/price/candlestick?interval=1h&start_time=${Math.floor(start * 1000)}&end_time=${Math.floor(end * 1000)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to get pool price for ${poolId} at ${start} to ${end}: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
  }[];

  if (data.length === 0) {
    throw new Error(`No price data found for pool on the specified minute (timestamp: ${atMinute})`);
  }

  const candle = data.reduce(
    (closest, entry) => {
      return closest === null ||
        Math.abs(entry.timestamp - atMinute) <
          Math.abs(closest.timestamp - atMinute)
        ? entry
        : closest;
    },
    null as (typeof data)[0] | null,
  );
  if (!candle) {
    throw new Error(
      `No exact price found (timestamp: ${atMinute})`,
    );
  }

  return candle.close;
}

export async function getPoolTradingFees(poolId: string): Promise<{ buyFee: number; sellFee: number }> {
  const response = await fetch(
    `https://api-mainnet-prod.minswap.org/v1/pools/${poolId}/metrics`,
  );
  if (!response.ok) {
    throw new Error(`Failed to get pool trading fees: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    asset_a: {token_name: string;};
    asset_b: {token_name: string;};
    trading_fee_tier: number[];
  };

  // Buy Fee is when you are buying the asset.
  // Sell Fee is when you are selling the asset.
  if (data.asset_a.token_name === fromText(config.INDIGO_ASSET_NAME)) {
    return { buyFee: data.trading_fee_tier[1], sellFee: data.trading_fee_tier[0] };
  }
  if (data.asset_b.token_name === fromText(config.INDIGO_ASSET_NAME)) {
    return { buyFee: data.trading_fee_tier[0], sellFee: data.trading_fee_tier[1] };
  }

  throw new Error(`Unable to determine trading fees for pool: ${poolId}`);
}

export function timestampToEpoch(timestamp: number): number {
  return Math.floor((timestamp - 1506203100) / 432000);
}

export function epochToTimestamp(epoch: number): number {
  return epoch * 432000 + 1506203100;
}
