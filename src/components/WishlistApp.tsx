'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label, Item, User } from '@/types';
import Sidebar from './Sidebar';
import ItemGrid from './ItemGrid';
import AddItemModal from './AddItemModal';
import AddLabelModal from './AddLabelModal';
import ItemDetailModal from './ItemDetailModal';
import AuthScreen from './AuthScreen';
import ShareModal from './ShareModal';

export default function WishlistApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [sharingLabel, setSharingLabel] = useState<Label | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async r => { if (r.ok) setUser(await r.json()); })
      .finally(() => setAuthChecked(true));
  }, []);

  const loadLabels = useCallback(async () => {
    const res = await fetch('/api/labels');
    if (res.ok) setLabels(await res.json());
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const url = selectedLabelId ? `/api/items?labelId=${selectedLabelId}` : '/api/items';
    const res = await fetch(url);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [selectedLabelId]);

  useEffect(() => { if (user) { loadLabels(); loadItems(); } }, [user]); // eslint-disable-line
  useEffect(() => { if (user) loadItems(); }, [selectedLabelId]); // eslint-disable-line

  const handleAddItem = async (url: string, labelIds: number[]) => {
    const res = await fetch('/api/items', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, labelIds }),
    });
    if (res.ok) { setShowAddItem(false); await loadItems(); }
    return res;
  };

  const handleAddLabel = async (name: string, color: string) => {
    const res = await fetch('/api/labels', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) { setShowAddLabel(false); await loadLabels(); }
    return res;
  };

  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleRefreshPrice = async (id: number) => {
    await fetch(`/api/items/${id}/refresh-price`, { method: 'POST' });
    await loadItems();
    if (selectedItem?.id === id) {
      const updated = await fetch(`/api/items/${id}`).then(r => r.json());
      setSelectedItem(updated);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    await Promise.all(items.map(item => fetch(`/api/items/${item.id}/refresh-price`, { method: 'POST' })));
    await loadItems();
    setRefreshingAll(false);
  };

  const handleDeleteLabel = async (id: number) => {
    await fetch(`/api/labels/${id}`, { method: 'DELETE' });
    setLabels(prev => prev.filter(l => l.id !== id));
    if (selectedLabelId === id) setSelectedLabelId(null);
    else await loadItems();
  };

  const handleUpdateItemLabels = async (id: number, labelIds: number[]) => {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelIds }),
    });
    await loadItems();
    if (selectedItem?.id === id) {
      const updated = await fetch(`/api/items/${id}`).then(r => r.json());
      setSelectedItem(updated);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setLabels([]); setItems([]); setSelectedLabelId(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  const selectedLabel = labels.find(l => l.id === selectedLabelId) ?? null;
  const ownedLabels = labels.filter(l => l.is_shared === 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        labels={labels} selectedLabelId={selectedLabelId} user={user}
        onSelectLabel={setSelectedLabelId} onAddLabel={() => setShowAddLabel(true)}
        onDeleteLabel={handleDeleteLabel} onShareLabel={setSharingLabel} onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedLabel ? selectedLabel.name : 'All Items'}
            </h1>
            {selectedLabel?.is_shared === 1 && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">Shared with me</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefreshAll} disabled={refreshingAll || items.length === 0}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2">
              <svg className={`h-4 w-4 ${refreshingAll ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshingAll ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            <button onClick={() => setShowAddItem(true)}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </header>
        <ItemGrid items={items} loading={loading} currentUserId={user.id}
          onSelectItem={setSelectedItem} onDeleteItem={handleDeleteItem} />
      </div>

      {showAddItem && (
        <AddItemModal labels={ownedLabels} defaultLabelId={selectedLabel?.is_shared === 0 ? selectedLabelId : null}
          onAdd={handleAddItem} onClose={() => setShowAddItem(false)} />
      )}
      {showAddLabel && <AddLabelModal onAdd={handleAddLabel} onClose={() => setShowAddLabel(false)} />}
      {sharingLabel && <ShareModal label={sharingLabel} onClose={() => setSharingLabel(null)} />}
      {selectedItem && (
        <ItemDetailModal item={selectedItem} labels={ownedLabels} user={user}
          onClose={() => setSelectedItem(null)} onRefreshPrice={handleRefreshPrice}
          onDelete={handleDeleteItem} onUpdateLabels={handleUpdateItemLabels} />
      )}
    </div>
  );
}
