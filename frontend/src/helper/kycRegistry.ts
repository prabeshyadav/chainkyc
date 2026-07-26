import { Contract, isAddress } from "ethers";
import { CHAIN_ID, assertOnExpectedChain, browserProvider } from "./chain";

export const KYC_REGISTRY_ADDRESS = import.meta.env.VITE_KYC_REGISTRY_ADDRESS;
export { CHAIN_ID };

export const KYC_REGISTRY_ABI = [
  "function anchorKYC(address user, string calldata ipfsCid, bytes32 dataHash) external",
  "function getVersionCount(address user) external view returns (uint256)",
  "function hasVerifiedKYC(address user) external view returns (bool)",
  "event KYCVerified(address indexed user, uint256 indexed version, string ipfsCid, bytes32 dataHash, address indexed verifiedBy, uint256 verifiedAt)",
];

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

export class RegistryNotDeployedError extends Error {
  constructor(address: string) {
    super(
      `No contract is deployed at ${address} on chain ${CHAIN_ID}. The registry ` +
        `address is stale or the chain was reset — redeploy, then update ` +
        `KYC_REGISTRY_ADDRESS and recreate the frontend container.`,
    );
    this.name = "RegistryNotDeployedError";
  }
}

export function requireRegistryAddress(): string {
  if (!KYC_REGISTRY_ADDRESS || !isAddress(KYC_REGISTRY_ADDRESS)) {
    throw new Error(
      "VITE_KYC_REGISTRY_ADDRESS is not set or invalid — check frontend/.env",
    );
  }
  return KYC_REGISTRY_ADDRESS;
}

export async function readOnlyRegistry(): Promise<Contract> {
  const address = requireRegistryAddress();
  const provider = browserProvider();

  await assertOnExpectedChain(provider);

  if ((await provider.getCode(address)) === "0x") {
    throw new RegistryNotDeployedError(address);
  }

  return new Contract(address, KYC_REGISTRY_ABI, provider);
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
