'use client';

import { useState, useEffect } from 'react';
import { Label, LabelShare } from '@/types';

interface Props { label: Label; onClose: () => void; }

export default function ShareModal({ label, onClose }: Props) {
  const [shares, setShares] = useState<LabelShare[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/labels/${label.id}/share`).then(r => r.json()).then(setShares);
  }, [label.id]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const res = await fetch(`/api/labels/${label.id}/share`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`Shared with ${data.email}`); setEmail('');
      fetch(`/api/labels/${label.id}/share`).then(r => r.json()).then(setShares);
    } else { setError(data.error || 'Failed to share'); }
    setLoading(false);
  };

  const handleRemove = async (userId: number) => {
    await fetch(`/api/labels/${label.id}/share`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setShares(prev => prev.filter(s => s.shared_with_user_id !== userId));
    setSuccess('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Share Wishlist</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: label.color }} />
              {label.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <form onSubmit={handleShare} className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter email address" autoFocus
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Share</button>
          </form>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          {shares.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Shared with</p>
              <div className="space-y-2">
                {shares.map(share => (
                  <div key={share.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-900">{share.email}</span>
                    <button onClick={() => handleRemove(share.shared_with_user_id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-2">Not shared with anyone yet</p>}
        </div>
      </div>
    </div>
  );
}
