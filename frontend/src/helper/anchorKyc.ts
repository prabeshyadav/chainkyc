import { BrowserProvider, Contract, isAddress } from "ethers";

const KYC_REGISTRY_ADDRESS = import.meta.env.VITE_KYC_REGISTRY_ADDRESS;
const CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || 31337);

const KYC_REGISTRY_ABI = [
  "function anchorKYC(address user, string calldata ipfsCid, bytes32 dataHash) external",
];

export interface AnchorKycResult {
  txHash: string;
  blockNumber: number;
}

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}
export async function anchorKyc(
  userAddress: string,
  ipfsCid: string,
  sha256Hash: string,
): Promise<AnchorKycResult> {
  if (!isAddress(userAddress)) {
    throw new Error(`Invalid user address: ${userAddress}`);
  }
  if (!ipfsCid) {
    throw new Error("ipfsCid is required");
  }

  const dataHash = sha256Hash.startsWith("0x") ? sha256Hash : `0x${sha256Hash}`;
  if (dataHash.length !== 66) {
    throw new Error(
      `dataHash must be 32 bytes (got ${(dataHash.length - 2) / 2} bytes)`,
    );
  }

  if (!KYC_REGISTRY_ADDRESS || !isAddress(KYC_REGISTRY_ADDRESS)) {
    throw new Error(
      "VITE_KYC_REGISTRY_ADDRESS is not set or invalid — check frontend/.env",
    );
  }

  if (!window.ethereum) {
    throw new Error("No injected wallet found (e.g. MetaMask)");
  }
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
  });

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    console.warn(
      `Wallet is on chainId ${network.chainId}, expected ${CHAIN_ID}`,
    );
  }

  const kycRegistry = new Contract(
    KYC_REGISTRY_ADDRESS,
    KYC_REGISTRY_ABI,
    signer,
  );

  let tx;
  try {
    tx = await kycRegistry.anchorKYC(userAddress, ipfsCid, dataHash);
  } catch (err: any) {
    throw new Error(`anchorKYC call failed: ${err.reason || err.message}`);
  }

  console.log("Tx submitted:", tx.hash);
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction was not mined (receipt is null)");
  }
  console.log("Tx confirmed in block:", receipt.blockNumber);

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}
