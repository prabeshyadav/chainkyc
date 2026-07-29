import { getAddress, isAddress } from "ethers";
import { readOnlyRegistry } from "./registry";

export interface BankCustomer {
  address: string;
  version: number | null;
  verifiedAt: number | null;
  ipfsCid: string | null;
}

export async function fetchBankCustomers(
  bankAddress: string,
): Promise<BankCustomer[]> {
  if (!isAddress(bankAddress)) {
    throw new Error(`Invalid bank address: ${bankAddress}`);
  }

  const registry = await readOnlyRegistry();
  console.log({ registry });

  const grants = await registry.queryFilter(
    registry.filters.AccessGranted(null, bankAddress),
    0,
    "latest",
  );

  const candidates = [
    ...new Set(
      grants
        .map((event) => ("args" in event ? event.args?.user : undefined))
        .filter((user): user is string => Boolean(user))
        .map((user) => getAddress(user)),
    ),
  ];

  const stillGranted = await Promise.all(
    candidates.map((user) => registry.hasAccess(user, bankAddress)),
  );

  const active = candidates.filter((_, i) => Boolean(stillGranted[i]));

  return Promise.all(active.map((address) => publicRecord(registry, address)));
}

async function publicRecord(
  registry: Awaited<ReturnType<typeof readOnlyRegistry>>,
  address: string,
): Promise<BankCustomer> {
  try {
    const record = await registry.getPublicKYC(address);
    return {
      address,
      version: Number(record[0]),
      ipfsCid: record[1],
      verifiedAt: Number(record[3]),
    };
  } catch {
    return { address, version: null, ipfsCid: null, verifiedAt: null };
  }
}
