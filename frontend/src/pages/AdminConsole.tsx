import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TopBar, SectionCard, Button } from '../components/ui';

interface Institution {
  id: number;
  name: string;
  initials: string;
  applied?: string;
  since?: string;
}

interface AccessField {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
  locked?: boolean;
}

const initialPending: Institution[] = [
  { id: 1, name: 'Global IME Bank', initials: 'GI', applied: 'Applied Jul 6, 2026' },
];

const initialWhitelisted: Institution[] = [
  { id: 1, name: 'eSewa', initials: 'eS', since: 'Whitelisted May 2, 2026' },
  { id: 2, name: 'Khalti', initials: 'KH', since: 'Whitelisted Apr 18, 2026' },
];

const auditLog = [
  { date: 'Jul 9', text: 'eSewa requested access to 0x71C7...8976.' },
  { date: 'Jul 6', text: 'Global IME Bank applied to join the network.' },
];

const initialFields: AccessField[] = [
  { id: 'status', label: 'Verified / not verified status', desc: 'Always shareable — core purpose of the network', enabled: true, locked: true },
  { id: 'name', label: 'Full legal name', desc: '', enabled: true },
  { id: 'citizenship', label: 'Citizenship number', desc: '', enabled: true },
  { id: 'dob', label: 'Date of birth', desc: '', enabled: false },
  { id: 'photo', label: 'Photograph', desc: '', enabled: false },
];

export default function AdminConsole() {
  const navigate = useNavigate();
  const { wallet, setRole } = useApp();
  const [pending, setPending] = useState<Institution[]>(initialPending);
  const [whitelisted, setWhitelisted] = useState<Institution[]>(initialWhitelisted);
  const [fields, setFields] = useState<AccessField[]>(initialFields);

  function logout() {
    setRole(null);
    navigate('/');
  }

  function approve(inst: Institution) {
    setPending((list) => list.filter((p) => p.id !== inst.id));
    setWhitelisted((list) => [{ ...inst, since: 'Whitelisted today' }, ...list]);
  }

  function reject(inst: Institution) {
    setPending((list) => list.filter((p) => p.id !== inst.id));
  }

  function suspend(inst: Institution) {
    setWhitelisted((list) => list.filter((w) => w.id !== inst.id));
  }

  function toggleField(id: string) {
    setFields((list) => list.map((f) => (f.id === id && !f.locked ? { ...f, enabled: !f.enabled } : f)));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar roleLabel="Admin" address={wallet || '0x1F0b...7Ae2'} onLogout={logout} />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div>
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">Admin &middot; {wallet || '0x1F0b...7Ae2'}</p>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Regulatory console</h1>
          <p className="text-ink-600">Whitelist institutions and audit network-wide verification activity.</p>
        </div>

        <SectionCard title="Pending institutions" description="Awaiting approval to join the network.">
          {pending.length === 0 ? (
            <p className="text-sm text-ink-400">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border border-line rounded-lg px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">{p.initials}</div>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900 text-sm">{p.name}</p>
                    <p className="text-xs text-ink-600">{p.applied}</p>
                  </div>
                  <Button variant="danger" onClick={() => reject(p)}>Reject</Button>
                  <Button variant="success" onClick={() => approve(p)}>Approve</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Whitelisted institutions" description="Currently allowed to request customer KYC.">
          <div className="space-y-3">
            {whitelisted.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border border-line rounded-lg px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">{w.initials}</div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900 text-sm">{w.name}</p>
                  <p className="text-xs text-ink-600">{w.since}</p>
                </div>
                <Button variant="danger" onClick={() => suspend(w)}>Suspend</Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Data field access rules" description="Fields institutions are permitted to request.">
          <div className="divide-y divide-line -mt-2">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink-900">{f.label}</p>
                  {f.desc && <p className="text-xs text-ink-600">{f.desc}</p>}
                </div>
                <button
                  onClick={() => toggleField(f.id)}
                  disabled={f.locked}
                  className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${f.enabled ? 'bg-accent-600' : 'bg-gray-200'} disabled:opacity-70`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${f.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Network audit log" description="All verification activity, across every institution.">
          <div className="divide-y divide-line -mt-2">
            {auditLog.map((a, i) => (
              <div key={i} className="flex gap-4 py-3 text-sm">
                <span className="text-ink-400 font-mono w-14 shrink-0">{a.date}</span>
                <span className="text-ink-900">{a.text}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
