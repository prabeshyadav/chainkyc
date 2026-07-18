import { TopBar, SectionCard, Button, Badge } from '../components/ui';
import { useAuthStore } from '../store/authStore';

const sentRequests = [
  { id: 1, address: '0x71C7...8976', date: 'Sent Jul 9, 2026', status: 'Pending' },
  { id: 2, address: '0x48a1...22Fd', date: 'Sent Jul 2, 2026', status: 'Approved' },
];

const verifiedCustomers = [
  { id: 1, address: '0x48a1...22Fd', shared: 'Shared fields: verified status, citizenship no.' },
];

const queryLog = [
  { date: 'Jul 9', text: 'Requested access to 0x71C7...8976.' },
  { date: 'Jul 2', text: 'Viewed verified status of 0x48a1...22Fd.' },
];

export default function InstitutionConsole() {
  const { walletAddress } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">Institution &middot; {walletAddress}</p>
            <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Institution console</h1>
            <p className="text-ink-600">Look up a customer's KYC status and manage your access requests.</p>
          </div>
          <Badge tone="success">Whitelisted</Badge>
        </div>

        <SectionCard title="Find a customer" description="Search by wallet address or KYC token.">
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-600 font-mono"
              placeholder="0x... wallet address or KYC token"
            />
            <Button>Send request</Button>
          </div>
        </SectionCard>

        <SectionCard title="Sent requests" description="Access requests you've sent to customers.">
          <div className="space-y-3">
            {sentRequests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border border-line rounded-lg px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600 font-mono">0x</div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900 text-sm font-mono">{r.address}</p>
                  <p className="text-xs text-ink-600">{r.date}</p>
                </div>
                <Badge tone={r.status === 'Approved' ? 'success' : 'warning'}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Verified customers" description="Customers who approved your access request.">
          <div className="space-y-3">
            {verifiedCustomers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border border-line rounded-lg px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600 font-mono">0x</div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900 text-sm font-mono">{c.address}</p>
                  <p className="text-xs text-ink-600">{c.shared}</p>
                </div>
                <Badge tone="success">Verified</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Query log" description="Every lookup you've made, recorded on-chain.">
          <div className="divide-y divide-line -mt-2">
            {queryLog.map((q, i) => (
              <div key={i} className="flex gap-4 py-3 text-sm">
                <span className="text-ink-400 font-mono w-14 shrink-0">{q.date}</span>
                <span className="text-ink-900">{q.text}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
