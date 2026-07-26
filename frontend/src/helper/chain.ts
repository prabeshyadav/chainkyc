import { BrowserProvider } from "ethers";

export const CHAIN_ID = BigInt(import.meta.env.VITE_CHAIN_ID || 31337);
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
export const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || "Anvil Local";
export const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || "ETH";

export const RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8545";

const NETWORK_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: CHAIN_NAME,
  rpcUrls: [RPC_URL],
  nativeCurrency: {
    name: CURRENCY_SYMBOL,
    symbol: CURRENCY_SYMBOL,
    decimals: 18,
  },
};

const UNRECOGNIZED_CHAIN = 4902;
const USER_REJECTED = 4001;

export class ChainMismatchError extends Error {
  readonly actual: bigint;

  constructor(actual: bigint) {
    super(
      `Your wallet is connected to chain ${actual}, but this app expects ` +
        `${CHAIN_NAME} (chain ${CHAIN_ID}). Switch networks in your wallet and try again.`,
    );
    this.name = "ChainMismatchError";
    this.actual = actual;
  }
}

function errorCodes(err: unknown): number[] {
  const codes: number[] = [];
  let node = err as { code?: unknown; data?: any; error?: any } | undefined;

  for (let depth = 0; node && depth < 5; depth += 1) {
    if (typeof node.code === "number") {
      codes.push(node.code);
    }
    node = node.data?.originalError ?? node.error ?? node.data;
  }

  return codes;
}

export function isUserRejection(err: unknown): boolean {
  return errorCodes(err).includes(USER_REJECTED);
}

function isUnrecognizedChain(err: unknown): boolean {
  return errorCodes(err).includes(UNRECOGNIZED_CHAIN);
}

export function requireInjectedProvider(): import("ethers").Eip1193Provider {
  if (!window.ethereum) {
    throw new Error("No injected wallet found (e.g. MetaMask)");
  }
  return window.ethereum;
}

export function browserProvider(): BrowserProvider {
  return new BrowserProvider(requireInjectedProvider());
}

async function switchChain(
  ethereum: import("ethers").Eip1193Provider,
): Promise<void> {
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: CHAIN_ID_HEX }],
  });
}

async function addChain(
  ethereum: import("ethers").Eip1193Provider,
): Promise<void> {
  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [NETWORK_PARAMS],
    });
  } catch (err) {
    if (isUserRejection(err)) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not add the "${CHAIN_NAME}" network (chain ${CHAIN_ID}, ${RPC_URL}) ` +
        `to your wallet automatically: ${detail} — check that the node is running ` +
        `and reachable at ${RPC_URL}, or add the network manually under ` +
        `MetaMask → Settings → Networks → Add a network manually.`,
    );
  }
}

export async function ensureChain(): Promise<BrowserProvider> {
  const ethereum = requireInjectedProvider();

  try {
    await switchChain(ethereum);
  } catch (err) {
    if (!isUnrecognizedChain(err)) {
      throw err;
    }
    await addChain(ethereum);
    await switchChain(ethereum);
  }

  const provider = new BrowserProvider(ethereum);
  await assertOnExpectedChain(provider);
  return provider;
}

export async function assertOnExpectedChain(
  provider: BrowserProvider,
): Promise<void> {
  const { chainId } = await provider.getNetwork();
  if (chainId !== CHAIN_ID) {
    throw new ChainMismatchError(chainId);
  }
}
