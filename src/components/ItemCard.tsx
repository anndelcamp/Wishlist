'use client';

import { Item } from '@/types';

interface Props { item: Item; isOwner: boolean; onClick: () => void; onDelete: () => void; }

function safeHostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

export default function ItemCard({ item, isOwner, onClick, onDelete }: Props) {
  const lastChecked = item.last_price_check
    ? new Date(item.last_price_check.replace(' ', 'T') + 'Z').toLocaleDateString()
    : null;

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      <div className="relative">
        {item.image_url
          ? <img src={item.image_url} alt={item.title || 'Product'} className="w-full h-48 object-cover bg-gray-100"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            </div>
        }
        {isOwner && (
          <button onClick={e => { e.stopPropagation(); if (window.confirm('Remove this item?')) onDelete(); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white rounded-full shadow text-gray-500 hover:text-red-500 transition-opacity">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {item.title || safeHostname(item.url)}
        </p>
        {item.price && <p className="text-lg font-bold text-indigo-600 mb-0.5">{item.price}</p>}
        {lastChecked && <p className="text-xs text-gray-400 mb-2">Updated {lastChecked}</p>}
        {item.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.labels.map(label => (
              <span key={label.id} className="px-2 py-0.5 rounded-full text-xs text-white font-medium"
                style={{ backgroundColor: label.color }}>{label.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
