'use client';

import { useState } from 'react';
import { Label } from '@/types';

interface Props {
  labels: Label[];
  defaultLabelId: number | null;
  onAdd: (url: string, labelIds: number[]) => Promise<Response>;
  onClose: () => void;
}

export default function AddItemModal({ labels, defaultLabelId, onAdd, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(defaultLabelId ? [defaultLabelId] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: number) =>
    setSelectedLabelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await onAdd(url.trim(), selectedLabelIds);
      if (!res.ok) setError((await res.json()).error || 'Failed to add item');
    } catch { setError('Failed to add item'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Add Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required autoFocus
              placeholder="https://www.amazon.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add to Wishlists</label>
              <div className="flex flex-wrap gap-2">
                {labels.map(label => (
                  <button key={label.id} type="button" onClick={() => toggle(label.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                      selectedLabelIds.includes(label.id) ? 'text-white border-transparent' : 'text-gray-600 bg-gray-50 border-gray-200'
                    }`}
                    style={selectedLabelIds.includes(label.id) ? { backgroundColor: label.color, borderColor: label.color } : {}}>
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Fetching...</> : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
