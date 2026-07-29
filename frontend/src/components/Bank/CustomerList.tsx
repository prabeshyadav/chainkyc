import { ChevronRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { BankCustomer } from "../../helper/bankCustomers";
import { Badge, Button } from "../ui";

function formatDate(unixSeconds: number | null): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function shorten(address: string): string {
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export default function CustomerList({
  customers,
  isLoading,
  isError,
  error,
  filtered,
}: {
  customers: BankCustomer[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  filtered: boolean;
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return <p className="text-sm text-ink-400">Loading customers...</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Could not load customers: {error?.message}
      </p>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users size={22} className="mx-auto text-ink-400 mb-2" />
        <p className="text-sm text-ink-600">
          {filtered ? "No customer matches that search." : "No customers yet."}
        </p>
        <p className="text-xs text-ink-400 mt-1">
          {filtered
            ? "Search by wallet address."
            : "Ask a customer to grant your institution access from their dashboard."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <div
          key={customer.address}
          className="flex items-center gap-4 border border-line rounded-lg px-4 py-3 hover:border-accent-600 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-gray-100 text-ink-600 flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink-900 font-mono truncate">
              <span className="hidden sm:inline">{customer.address}</span>
              <span className="sm:hidden">{shorten(customer.address)}</span>
            </p>
            <p className="text-xs text-ink-400 mt-0.5">
              {customer.version
                ? `Verified ${formatDate(customer.verifiedAt)}`
                : "Access granted — KYC not anchored yet"}
            </p>
          </div>

          {customer.version ? (
            <>
              <Badge tone="success">v{customer.version}</Badge>
              <Button
                onClick={() => navigate(`/bank/customers/${customer.address}`)}
              >
                View KYC
                <ChevronRight size={14} />
              </Button>
            </>
          ) : (
            <Badge tone="warning">Awaiting KYC</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
