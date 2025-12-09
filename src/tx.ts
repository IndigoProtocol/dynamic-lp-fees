import { getAddressDetails, LucidEvolution, TxBuilder } from "@lucid-evolution/lucid";
import JSONBig from "json-bigint"

const MIN_TRADING_FEE: bigint = 5n; // 0.05%
const MAX_TRADING_FEE: bigint = 2000n; // 20%

const LP_POLICY_ID_CFG = {
  ["Mainnet"]: "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c",
  ["Preprod"]: "d6aae2059baee188f74917493cf7637e679cd219bdfbbf4dcbeb1d0b",
}

function assetToDottedString(asset: { policyId: string; tokenName: string }): string {
  if (asset.policyId === "" && asset.tokenName === "") {
    return "lovelace"
  }
  if (asset.tokenName === "") {
    return asset.policyId;
  }
  return `${asset.policyId}.${asset.tokenName}`;
}

/**
 * Request to update the trading fees for a liquidity pool.
 * @property managerAddress - The address of the pool manager authorized to update fees
 * @property poolLPAsset - The LP token asset identifying the pool
 * @property newFeeA - The new fee for trading direction A as a percentage (0.05% - 20%)
 * @property newFeeB - The new fee for trading direction B as a percentage (0.05% - 20%)
 * @property version - Protocol version for the fee request format
 */
export type PoolFeeRequest = {
  managerAddress: string;
  poolLPAsset: {
    policyId: string,
    tokenName: string
  };
  newFeeA: number;
  newFeeB: number;
  version: "1";
};

export type RequestPoolFeeOptions = {
  request: Omit<PoolFeeRequest, "version">;
};

/**
 * Creates a transaction to update the trading fees for a liquidity pool.
 * This method builds a transaction with metadata that requests fee changes for a pool.
 * The transaction must be signed by the pool manager address.
 */
export function updatePoolFeeTx(
  lucid: LucidEvolution,
  options: Omit<PoolFeeRequest, "version">
): TxBuilder {
  const { managerAddress, poolLPAsset, newFeeA, newFeeB } = options;
  const newFeeABps = BigInt(Math.floor(newFeeA * 100));
  const newFeeBBps = BigInt(Math.floor(newFeeB * 100));

  if (newFeeABps < MIN_TRADING_FEE || newFeeABps > MAX_TRADING_FEE) {
    throw new Error(
      `Liquidity Pool Fee A must be in 0.05% - 20%, actual: ${newFeeA}%`
    );
  }
  if (newFeeBBps < MIN_TRADING_FEE || newFeeBBps > MAX_TRADING_FEE) {
    throw new Error(
      `Liquidity Pool Fee B must be in 0.05% - 20%, actual: ${newFeeB}%`
    );
  }

  const network = lucid.config().network;
  if (network !== "Mainnet" && network !== "Preprod") {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (poolLPAsset.policyId != LP_POLICY_ID_CFG[network]) {
    throw new Error(
      `Invalid LP Policy ID for network ${network}: ${poolLPAsset.policyId}`
    );
  }

  const feeRequestJSON = JSONBig.stringify({
    managerAddress: managerAddress,
    poolLPAsset: assetToDottedString(poolLPAsset),
    newFeeA: newFeeABps.toString(),
    newFeeB: newFeeBBps.toString(),
    version: "1",
  }).match(/.{1,64}/g);

  if (!feeRequestJSON) {
    throw new Error("Failed to create fee request JSON metadata");
  }
  const addressDetails = getAddressDetails(managerAddress);
  if (addressDetails.type != "Base" && addressDetails.type != "Enterprise") {
    throw new Error("Manager address must be a Base or Enterprise address");
  }
  const paymentCred = addressDetails.paymentCredential;
  if (!paymentCred) {
    throw new Error("Manager address must have a payment credential");
  }
  if (paymentCred.type !== "Key") {
    throw new Error("Manager address must be a key address");
  }

  return lucid
    .newTx()
    .addSigner(managerAddress)
    .attachMetadata(674, {
      ["msg"]: ["Minswap: Request of Pool Fee Manager"],
      ["extraData"]: feeRequestJSON,
    });
}