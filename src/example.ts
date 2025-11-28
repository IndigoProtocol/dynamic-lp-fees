import { Blockfrost, Lucid } from '@lucid-evolution/lucid';
import { updatePoolFeeTx } from './tx';

async function main() {
  const blockfrostProjectId = '<>YOUR_BLOCKFROST_PROJECT_ID<>';
  const blockfrostUrl = 'https://cardano-preprod.blockfrost.io/api/v0';

  // Example wallet: It has been granted permissions to manage the pool
  const seed =
    'mouse carpet zebra giant just pizza very song simple state rebel lunar above naive bundle accuse buffalo hurry mango scorpion country silly layer average';
  const walletAddr =
    'addr_test1qz280luwccrquk3lk4ykjjsexl840ppsy2u6vtq4wflwa2c279l7xk8kwpt4zc27c4dsngvpyuqn700m3s8e0k6fw9nsdudnqx';
  // The LP asset for the pool we want to update fees for
  const poolLPAsset = {
    policyId: 'd6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b',
    tokenName:
      '0c9dfded2857d530ce2cc536d4517a6e4c54e280f5e89b4f315fe0d81cabbcf5',
  };

  const lucid = await Lucid(
    new Blockfrost(blockfrostUrl, blockfrostProjectId),
    'Preprod',
  );

  lucid.selectWallet.fromSeed(seed);

  const tx = updatePoolFeeTx(lucid, {
    managerAddress: walletAddr,
    poolLPAsset: poolLPAsset,
    newFeeA: 0.9,
    newFeeB: 0.3,
  });

  const txComplete = await tx.complete();
  const signedTx = await txComplete.sign.withWallet().complete();
  const txHash = await signedTx.submit();
  console.log('Transaction submitted successfully: ', txHash);
}

void main();
