'use client';

import { Label } from '@/types';

interface Props {
  labels: Label[];
  selectedLabelId: number | null;
  onSelectLabel: (id: number | null) => void;
  onAddLabel: () => void;
  onDeleteLabel: (id: number) => void;
}

export default function Sidebar({ labels, selectedLabelId, onSelectLabel, onAddLabel, onDeleteLabel }: Props) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-bold text-lg tracking-tight">Wishlists</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => onSelectLabel(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedLabelId === null ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          All Items
        </button>

        {labels.length > 0 && (
          <div className="pt-3">
            <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">My Wishlists</p>
            {labels.map(label => (
              <div key={label.id} className="group relative">
                <button
                  onClick={() => onSelectLabel(label.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors pr-8 ${
                    selectedLabelId === label.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                  <span className="truncate">{label.name}</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${label.name}" wishlist? Items will not be deleted.`))
                      onDeleteLabel(label.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 hover:text-red-400 transition-opacity"
                  title="Delete wishlist"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={onAddLabel}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Wishlist
        </button>
      </div>
    </div>
  );
}
