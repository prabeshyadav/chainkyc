import { Contract, isAddress } from "ethers";
import { assertOnExpectedChain, browserProvider, ensureChain } from "./chain";
import { RegistryNotDeployedError, WrongAccountError } from "./error";

export const KYC_REGISTRY_ADDRESS = import.meta.env.VITE_KYC_REGISTRY_ADDRESS;

export const KYC_REGISTRY_ABI = [
  "function anchorKYC(address user, string calldata ipfsCid, bytes32 dataHash) external",
  "function getVersionCount(address user) external view returns (uint256)",
  "function hasVerifiedKYC(address user) external view returns (bool)",
  "function roleManager() external view returns (address)",
  "function getPublicKYC(address user) external view returns (uint256 version, string ipfsCid, bytes32 dataHash, uint256 verifiedAt, address verifiedBy)",
  "function grantAccess(address bank) external",
  "function revokeAccess(address bank) external",
  "function hasAccess(address user, address bank) external view returns (bool)",
  "event KYCVerified(address indexed user, uint256 indexed version, string ipfsCid, bytes32 dataHash, address indexed verifiedBy, uint256 verifiedAt)",
  "event AccessGranted(address indexed user, address indexed bank)",
  "event AccessRevoked(address indexed user, address indexed bank)",
];

export function requireRegistryAddress(): string {
  if (!KYC_REGISTRY_ADDRESS || !isAddress(KYC_REGISTRY_ADDRESS)) {
    throw new Error(
      "VITE_KYC_REGISTRY_ADDRESS is not set or invalid — check frontend/.env",
    );
  }
  return KYC_REGISTRY_ADDRESS;
}

export async function writableRegistry(
  expectedUser: string,
): Promise<Contract> {
  const address = requireRegistryAddress();
  const provider = await ensureChain();

  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const selected = await signer.getAddress();

  if (selected.toLowerCase() !== expectedUser.toLowerCase()) {
    throw new WrongAccountError(selected, expectedUser);
  }

  if ((await provider.getCode(address)) === "0x") {
    throw new RegistryNotDeployedError(address);
  }

  return new Contract(address, KYC_REGISTRY_ABI, signer);
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
