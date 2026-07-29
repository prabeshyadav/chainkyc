import { isAddress } from "ethers";
import { readOnlyRegistry, writableRegistry } from "./registry";
import { fetchWhitelistedBanks } from "./roleManager";

export interface BankAccess {
  address: string;
  granted: boolean;
}

export async function fetchBankAccess(
  userAddress: string,
): Promise<BankAccess[]> {
  if (!isAddress(userAddress)) {
    throw new Error(`Invalid user address: ${userAddress}`);
  }

  const registry = await readOnlyRegistry();
  const banks = await fetchWhitelistedBanks();

  const granted = await Promise.all(
    banks.map((bank) => registry.hasAccess(userAddress, bank)),
  );

  return banks.map((address, i) => ({ address, granted: Boolean(granted[i]) }));
}

export async function setBankAccess(
  userAddress: string,
  bank: string,
  grant: boolean,
): Promise<string> {
  if (!isAddress(bank)) {
    throw new Error(`Invalid bank address: ${bank}`);
  }

  const registry = await writableRegistry(userAddress);

  let tx;
  try {
    tx = grant
      ? await registry.grantAccess(bank)
      : await registry.revokeAccess(bank);
  } catch (err: any) {
    const action = grant ? "grantAccess" : "revokeAccess";
    throw new Error(`${action} failed: ${err.reason || err.message}`);
  }

  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction was not mined (receipt is null)");
  }

  return receipt.hash;
}
