'use client';

import { Item } from '@/types';
import ItemCard from './ItemCard';

interface Props {
  items: Item[];
  loading: boolean;
  currentUserId: number;
  onSelectItem: (item: Item) => void;
  onDeleteItem: (id: number) => void;
}

export default function ItemGrid({ items, loading, currentUserId, onSelectItem, onDeleteItem }: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
        <svg className="h-16 w-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-lg font-medium">No items yet</p>
        <p className="text-sm">Click \"Add Item\" and paste a product URL to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => (
          <ItemCard key={item.id} item={item}
            isOwner={item.user_id === currentUserId || item.user_id === null}
            onClick={() => onSelectItem(item)}
            onDelete={() => onDeleteItem(item.id)} />
        ))}
      </div>
    </div>
  );
}
