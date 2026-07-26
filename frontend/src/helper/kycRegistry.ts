import { BrowserProvider, Contract, isAddress } from "ethers";

export const KYC_REGISTRY_ADDRESS = import.meta.env.VITE_KYC_REGISTRY_ADDRESS;
export const CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || 31337);

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

export function requireRegistryAddress(): string {
  if (!KYC_REGISTRY_ADDRESS || !isAddress(KYC_REGISTRY_ADDRESS)) {
    throw new Error(
      "VITE_KYC_REGISTRY_ADDRESS is not set or invalid — check frontend/.env",
    );
  }
  return KYC_REGISTRY_ADDRESS;
}

export function readOnlyRegistry(): Contract {
  const address = requireRegistryAddress();
  if (!window.ethereum) {
    throw new Error("No injected wallet found (e.g. MetaMask)");
  }
  return new Contract(
    address,
    KYC_REGISTRY_ABI,
    new BrowserProvider(window.ethereum),
  );
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

  const count = Number(await readOnlyRegistry().getVersionCount(userAddress));

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
  const registry = readOnlyRegistry();

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
