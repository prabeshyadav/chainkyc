import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { TopBar, Button } from '../components/ui';

export default function Confirmation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-xl mx-auto py-20 px-6">
        <div className="bg-white border border-line rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-2">Submitted for verification</h1>
          <p className="text-ink-600 max-w-sm mx-auto mb-8 leading-relaxed">
            A licensed verifier will review your documents off-chain. You'll get a notification the moment your KYC token is issued, usually within 24 hours.
          </p>
          <div className="bg-gray-50 border border-line rounded-lg px-4 py-3 font-mono text-xs text-ink-600 mb-8">
            tx: 0x4a2f...c718 &middot; status: awaiting_verifier &middot; block: 19,204,551
          </div>
          <Button onClick={() => navigate('/dashboard')}>Go to your dashboard</Button>
        </div>
      </div>
    </div>
  );
}
