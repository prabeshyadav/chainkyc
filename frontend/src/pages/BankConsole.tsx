import { CheckCircle2, Clock, RefreshCw, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import CustomerList from "../components/Bank/CustomerList";
import { Badge, SectionCard, Stat, TopBar } from "../components/ui";
import { useBankCustomers } from "../queries/bank";
import { useAuthStore } from "../store/authStore";

export default function BankConsole() {
  const { walletAddress } = useAuthStore();
  const [query, setQuery] = useState("");
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useBankCustomers(walletAddress);

  const verified = customers.filter((c) => c.version).length;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matching = term
      ? customers.filter((c) => c.address.toLowerCase().includes(term))
      : customers;

    return [...matching].sort(
      (a, b) => (b.verifiedAt ?? 0) - (a.verifiedAt ?? 0),
    );
  }, [customers, query]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono truncate">
              Bank &middot; {walletAddress}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
              Bank console
            </h1>
            <p className="text-ink-600">
              Customers who have granted you access to their verified KYC.
            </p>
          </div>
          <Badge tone="success">Whitelisted</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="Customers"
            value={customers.length}
            icon={<Users size={16} />}
          />
          <Stat
            label="Verified KYC"
            value={verified}
            icon={<CheckCircle2 size={16} />}
          />
          <Stat
            label="Awaiting KYC"
            value={customers.length - verified}
            icon={<Clock size={16} />}
          />
        </div>

        <SectionCard
          title="KYC records"
          description="Populated from on-chain access grants — customers appear here once they share with you."
          action={
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin" : undefined}
              />
              Refresh
            </button>
          }
        >
          {customers.length > 0 && (
            <div className="relative mb-4">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by wallet address"
                className="w-full rounded-lg border border-line pl-9 pr-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-transparent"
              />
            </div>
          )}

          <CustomerList
            customers={visible}
            isLoading={isLoading}
            isError={isError}
            error={error}
            filtered={query.trim().length > 0}
          />
        </SectionCard>
      </div>
    </div>
  );
}
