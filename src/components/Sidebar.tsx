'use client';

import { Label, User } from '@/types';

interface Props {
  labels: Label[];
  selectedLabelId: number | null;
  user: User;
  onSelectLabel: (id: number | null) => void;
  onAddLabel: () => void;
  onDeleteLabel: (id: number) => void;
  onShareLabel: (label: Label) => void;
  onLogout: () => void;
}

export default function Sidebar({ labels, selectedLabelId, user, onSelectLabel, onAddLabel, onDeleteLabel, onShareLabel, onLogout }: Props) {
  const ownedLabels = labels.filter(l => l.is_shared === 0);
  const sharedLabels = labels.filter(l => l.is_shared === 1);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-bold text-lg tracking-tight">Wishlists</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <button onClick={() => onSelectLabel(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedLabelId === null ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          All Items
        </button>

        {ownedLabels.length > 0 && (
          <div className="pt-3">
            <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">My Wishlists</p>
            {ownedLabels.map(label => (
              <div key={label.id} className="group relative">
                <button onClick={() => onSelectLabel(label.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors pr-16 ${
                    selectedLabelId === label.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}>
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                  <span className="truncate">{label.name}</span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onShareLabel(label)}
                    className="p-1 rounded text-gray-500 hover:text-indigo-300 transition-colors" title="Share wishlist">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Delete "${label.name}"? Items will not be deleted.`)) onDeleteLabel(label.id); }}
                    className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sharedLabels.length > 0 && (
          <div className="pt-3">
            <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Shared with Me</p>
            {sharedLabels.map(label => (
              <button key={label.id} onClick={() => onSelectLabel(label.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedLabelId === label.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                <span className="truncate">{label.name}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-700 space-y-1">
        <button onClick={onAddLabel}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Wishlist
        </button>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg">
          <span className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</span>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-400 ml-2 shrink-0 transition-colors" title="Sign out">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
