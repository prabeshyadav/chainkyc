import { Contract, ZeroAddress } from "ethers";
import { browserProvider } from "./chain";
import { readOnlyRegistry } from "./registry";

export const ROLE_MANAGER_ABI = [
  "function getAllBanks() external view returns (address[])",
  "function isBank(address user) external view returns (bool)",
];

export async function readOnlyRoleManager(): Promise<Contract> {
  const registry = await readOnlyRegistry();
  const address: string = await registry.roleManager();

  if (address === ZeroAddress) {
    throw new Error(
      "The KYC registry is not wired to a RoleManager — redeploy the contracts.",
    );
  }

  return new Contract(address, ROLE_MANAGER_ABI, browserProvider());
}

export async function fetchWhitelistedBanks(): Promise<string[]> {
  const roleManager = await readOnlyRoleManager();
  const banks: string[] = await roleManager.getAllBanks();
  return [...banks];
}
