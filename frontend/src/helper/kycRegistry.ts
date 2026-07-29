import { isAddress } from "ethers";
import { CHAIN_ID } from "./chain";
import { readOnlyRegistry } from "./registry";

export { CHAIN_ID };

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

export interface OnChainAnchorState {
  versionCount: number;
  anchored: boolean;
}

export async function readAnchorState(
  userAddress: string,
  version: number,
): Promise<OnChainAnchorState> {
  if (!isAddress(userAddress)) {
    throw new Error(`Invalid user address: ${userAddress}`);
  }

  const registry = await readOnlyRegistry();
  const count = Number(await registry.getVersionCount(userAddress));

  return { versionCount: count, anchored: count >= version };
}

export interface AnchorTxRef {
  txHash: string;
  blockNumber: number;
}

export async function findAnchorTx(
  userAddress: string,
  version: number,
): Promise<AnchorTxRef | null> {
  const registry = await readOnlyRegistry();

  const events = await registry.queryFilter(
    registry.filters.KYCVerified(userAddress, version),
    0,
    "latest",
  );

  const event = events.at(-1);
  if (!event) {
    return null;
  }

  return { txHash: event.transactionHash, blockNumber: event.blockNumber };
}
