import { CHAIN_ID } from "./chain";

export class WrongAccountError extends Error {
  constructor(selected: string, expected: string) {
    super(
      `Your wallet is on ${selected}, but you are signed in as ${expected}. ` +
        `Access is granted to whichever account signs the transaction, so ` +
        `switch back to ${expected} in MetaMask before continuing.`,
    );
    this.name = "WrongAccountError";
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
