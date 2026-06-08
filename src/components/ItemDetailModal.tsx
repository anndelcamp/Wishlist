'use client';

import { useState, useEffect } from 'react';
import { Item, Label, Comment } from '@/types';

interface Props {
  item: Item;
  labels: Label[];
  onClose: () => void;
  onRefreshPrice: (id: number) => Promise<void>;
  onDelete: (id: number) => void;
  onUpdateLabels: (id: number, labelIds: number[]) => Promise<void>;
}

function safeHostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function formatDate(dateStr: string) {
  return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleString();
}

export default function ItemDetailModal({ item, labels, onClose, onRefreshPrice, onDelete, onUpdateLabels }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [userName, setUserName] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLabels, setEditingLabels] = useState(false);
  const [pendingLabelIds, setPendingLabelIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('wishlist-username');
    if (stored) setUserName(stored);
  }, []);

  useEffect(() => {
    setLoadingComments(true);
    fetch(`/api/items/${item.id}/comments`)
      .then(r => r.json())
      .then(data => { setComments(data); setLoadingComments(false); });
  }, [item.id]);

  const startEditing = () => {
    setPendingLabelIds([...item.label_ids]);
    setEditingLabels(true);
  };

  const cancelEditing = () => setEditingLabels(false);

  const saveLabels = async () => {
    await onUpdateLabels(item.id, pendingLabelIds);
    setEditingLabels(false);
  };

  const togglePendingLabel = (id: number) =>
    setPendingLabelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleRefreshPrice = async () => {
    setRefreshing(true);
    await onRefreshPrice(item.id);
    setRefreshing(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const name = userName.trim() || 'Anonymous';
    localStorage.setItem('wishlist-username', name);
    const res = await fetch(`/api/items/${item.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: name, text: commentText.trim() }),
    });
    if (res.ok) {
      setComments(prev => [...prev, await res.json()]);
      setCommentText('');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1.5 min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="truncate">{safeHostname(item.url)}</span>
          </a>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <button
              onClick={() => { if (window.confirm('Remove this item?')) { onDelete(item.id); onClose(); } }}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {item.image_url && (
            <div className="w-full h-64 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={item.image_url}
                alt={item.title || 'Product'}
                className="max-h-full max-w-full object-contain"
                onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="p-5 space-y-5">
            <h2 className="text-xl font-semibold text-gray-900 leading-snug">
              {item.title || safeHostname(item.url)}
            </h2>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              {item.price ? (
                <span className="text-2xl font-bold text-indigo-600">{item.price}</span>
              ) : (
                <span className="text-sm text-gray-400">No price detected</span>
              )}
              <button
                onClick={handleRefreshPrice}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <svg className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh Price'}
              </button>
            </div>
            {item.last_price_check && (
              <p className="-mt-3 text-xs text-gray-400">Last checked: {formatDate(item.last_price_check)}</p>
            )}

            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            )}

            {/* Wishlists */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-700">Wishlists</span>
                {!editingLabels ? (
                  <button onClick={startEditing} className="text-xs text-indigo-600 hover:text-indigo-800">Edit</button>
                ) : (
                  <>
                    <button onClick={saveLabels} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Save</button>
                    <button onClick={cancelEditing} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                  </>
                )}
              </div>
              {editingLabels ? (
                <div className="flex flex-wrap gap-2">
                  {labels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => togglePendingLabel(label.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all border-2 ${
                        pendingLabelIds.includes(label.id) ? 'text-white border-transparent' : 'text-gray-600 bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      style={pendingLabelIds.includes(label.id) ? { backgroundColor: label.color, borderColor: label.color } : {}}
                    >
                      {label.name}
                    </button>
                  ))}
                  {labels.length === 0 && <span className="text-sm text-gray-400">No wishlists created yet</span>}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {item.labels.length > 0 ? item.labels.map(label => (
                    <span
                      key={label.id}
                      className="px-3 py-1 rounded-full text-sm text-white font-medium"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  )) : (
                    <span className="text-sm text-gray-400">Not in any wishlist — <button onClick={startEditing} className="text-indigo-600 hover:underline">add to one</button></span>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Comments {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
              </h3>

              {loadingComments ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{c.user_name}</span>
                        <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitComment} className="space-y-2">
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Your name (saved locally)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
