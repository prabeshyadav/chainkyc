import { Building2 } from "lucide-react";
import { useState } from "react";
import { isUserRejection } from "../../helper/chain";
import { useBankAccess, useSetBankAccess } from "../../queries/access";
import { Badge, Button, SectionCard } from "../ui";

export default function BankAccessSection({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const {
    data: banks = [],
    isLoading,
    isError,
    error,
  } = useBankAccess(walletAddress);
  const setAccess = useSetBankAccess(walletAddress);
  const [txError, setTxError] = useState("");

  function onToggle(bank: string, grant: boolean) {
    setTxError("");
    setAccess.mutate(
      { bank, grant },
      {
        onError: (err) => {
          if (isUserRejection(err)) return;
          setTxError(err instanceof Error ? err.message : String(err));
        },
      },
    );
  }

  return (
    <SectionCard
      title="Institution access"
      description="Choose which banks can read your verified KYC. Each change is a transaction you sign yourself."
    >
      {isLoading ? (
        <p className="text-sm text-ink-400">Loading institutions...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          Could not load institutions: {error.message}
        </p>
      ) : banks.length === 0 ? (
        <p className="text-sm text-ink-400">
          No institutions are approved on this network yet.
        </p>
      ) : (
        <div className="space-y-3">
          {banks.map((bank) => {
            const pending =
              setAccess.isPending && setAccess.variables?.bank === bank.address;

            return (
              <div
                key={bank.address}
                className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-ink-600 shrink-0">
                  <Building2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-600 font-mono truncate">
                    {bank.address}
                  </p>
                </div>
                {bank.granted && <Badge tone="success">Access granted</Badge>}
                <Button
                  variant={bank.granted ? "danger" : "primary"}
                  disabled={pending}
                  onClick={() => onToggle(bank.address, !bank.granted)}
                >
                  {pending
                    ? bank.granted
                      ? "Revoking..."
                      : "Granting..."
                    : bank.granted
                      ? "Revoke"
                      : "Grant access"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {txError && <p className="text-sm text-red-600 mt-3">{txError}</p>}
    </SectionCard>
  );
}
