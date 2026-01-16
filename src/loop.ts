import config from './config';
import { getLogger } from './logger';
import { updatePoolFeeTx } from './tx';
import { getOraclePriceForAssetAt, getPoolPriceAt, timestampToEpoch, epochToTimestamp, getPoolTradingFees, lucidFromConfig } from './utils';

const depegRange = 0.02; // 2%

export async function runBotLoop(): Promise<void> {
  while (true) {
    // Get the current timestamp and epoch.
    const timestamp = Date.now() / 1000;
    const epoch = timestampToEpoch(timestamp);
    const startOfEpoch = epochToTimestamp(epoch);

    const epochDeviations = [];

    // Loop through the 5 days prior to the current epoch crossing.
    for (let i = 1; i <= 5; i++) {
      const dayTimestamp = startOfEpoch - (i * 86400);
      // Fetch the price from the MinSwap pool at the timestamp provided.
      const poolPrice = await getPoolPriceAt(config.MINSWAP_POOL_ID, dayTimestamp);
      // Fetch the oracle price for the Indigo asset at the timestamp provided.
      const oraclePrice = await getOraclePriceForAssetAt(config.INDIGO_ASSET_NAME, dayTimestamp);
      // Calculate the deviation between the pool price and the oracle price.
      const deviation = (poolPrice - oraclePrice) / oraclePrice;

      epochDeviations.push(deviation);

      getLogger().debug(`Timestamp: ${dayTimestamp}, Pool price: ${poolPrice}, Oracle price: ${oraclePrice}, Deviation: ${deviation}`);
    }

    // Calculate the average deviation.
    const averageDeviation =
      epochDeviations.reduce((acc, curr) => acc + curr, 0) / epochDeviations.length;

    const sign = averageDeviation === 0 ? 0 : averageDeviation > 0 ? 1 : -1;
    const quotient = averageDeviation / depegRange;
    const roundTo = sign * 0.05;
    // MROUND: rounds quotient to the nearest multiple of roundTo (could be 0)
    const ratio = roundTo === 0 ? 0 : Math.round(quotient / roundTo) * roundTo;

    const buyFee = Number((Math.max(Math.min(ratio * 0.02, 0.02), 0.0005) * 100).toFixed(2));
    const sellFee = Number((Math.max(Math.min(ratio * -0.02, 0.02), 0.0005) * 100).toFixed(2));

    getLogger().debug(`Average deviation: ${averageDeviation}, Ratio: ${ratio}, Buy Fee: ${buyFee}%, Sell Fee: ${sellFee}%`);

    // Check current buy and sell fees.
    const { buyFee: currentBuyFee, sellFee: currentSellFee } = await getPoolTradingFees(config.MINSWAP_POOL_ID);

    getLogger().debug(`Current buy fee: ${currentBuyFee}%, Current sell fee: ${currentSellFee}%`);

    if (currentBuyFee !== buyFee || currentSellFee !== sellFee) {
      getLogger().info(`Updating fees from ${currentBuyFee}, ${currentSellFee} to ${buyFee}, ${sellFee}`);

      if (config.ALLOW_PUBLISH) {
        const lucid = await lucidFromConfig();
        const address = await lucid.wallet().address();

        const poolLPAsset = {
          policyId: config.MINSWAP_PUBLISH_POOL_ID.split('.')[0],
          tokenName: config.MINSWAP_PUBLISH_POOL_ID.split('.')[1],
        };

        const tx = updatePoolFeeTx(lucid, {
          managerAddress: address,
          poolLPAsset: poolLPAsset,
          newFeeA: buyFee,
          newFeeB: sellFee,
        });

        const txComplete = await tx.complete();
        const signedTx = await txComplete.sign.withWallet().complete();

        const txHash = await signedTx.submit();
        getLogger().info(`Transaction submitted successfully: ${txHash}, awaiting confirmation...`);

        await lucid.awaitTx(txHash);

        getLogger().info(`Transaction confirmed: ${txHash}`);
      } else {
        getLogger().warn(`Skipping transaction... ALLOW_PUBLISH is disabled.`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, config.LOOP_INTERVAL)); // 10 seconds
  }
}